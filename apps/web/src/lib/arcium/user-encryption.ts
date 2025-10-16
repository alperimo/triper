/**
 * User profile encryption utilities for Arcium MPC
 * Handles encryption of user interests and preferences stored in UserProfile account
 * 
 * MUST match encrypted-ixs/src/trip_matching.rs UserInterests structure EXACTLY
 */

import { x25519, RescueCipher, getMXEPublicKey } from '@arcium-hq/client';
import { AnchorProvider, web3 } from '@coral-xyz/anchor';
import { InterestTag } from '@/types';

// Constants from Rust circuit
const MAX_INTERESTS = 32;

/**
 * UserProfile data to be encrypted
 * Stores user interests and preferences
 */
export interface UserProfileData {
  interests: InterestTag[];  // Will be converted to bool[32]
  displayName?: string;      // Optional user display name
  bio?: string;              // Optional bio
}

/**
 * UserInterests structure EXACTLY matching Rust circuit in encrypted-ixs/src/trip_matching.rs
 * 
 * pub struct UserInterests {
 *     interests: [bool; 32],  // Boolean flags for interest categories
 * }
 * 
 * Total size: 32 bytes
 * 
 * NOTE: displayName and bio are added as additional encrypted fields
 * but not used in the MPC circuit (only interests are used for matching)
 */

/**
 * Serialize user profile data to format expected by Arcium circuit
 * MUST match encrypted-ixs/src/trip_matching.rs UserInterests struct
 * 
 * Rust structure:
 * pub struct UserInterests {
 *     interests: [bool; 32],
 * }
 */
export function serializeUserData(data: UserProfileData): bigint[] {
  const serialized: bigint[] = [];
  
  // 1. Convert interests to boolean array
  const interestFlags = new Array(MAX_INTERESTS).fill(false);
  
  data.interests.forEach(interest => {
    // InterestTag is an enum with numeric values 0-31
    if (interest >= 0 && interest < MAX_INTERESTS) {
      interestFlags[interest] = true;
    }
  });
  
  // Pack bool flags into bigints (8 bools per byte, 4 bytes per bigint)
  // Each bigint holds 32 bools (4 bytes × 8 bits = 32 bools)
  let packedValue = BigInt(0);
  for (let i = 0; i < MAX_INTERESTS; i++) {
    if (interestFlags[i]) {
      packedValue |= (BigInt(1) << BigInt(i));
    }
  }
  serialized.push(packedValue);
  
  // 2. Add optional display name (as UTF-8 bytes)
  if (data.displayName) {
    const nameBytes = new TextEncoder().encode(data.displayName);
    // Pack name bytes into bigints (8 bytes per bigint)
    for (let i = 0; i < nameBytes.length; i += 8) {
      let chunk = BigInt(0);
      for (let j = 0; j < 8 && i + j < nameBytes.length; j++) {
        chunk |= BigInt(nameBytes[i + j]) << (BigInt(j) * BigInt(8));
      }
      serialized.push(chunk);
    }
  }
  
  // 3. Add optional bio (as UTF-8 bytes)
  if (data.bio) {
    const bioBytes = new TextEncoder().encode(data.bio);
    // Pack bio bytes into bigints (8 bytes per bigint)
    for (let i = 0; i < bioBytes.length; i += 8) {
      let chunk = BigInt(0);
      for (let j = 0; j < 8 && i + j < bioBytes.length; j++) {
        chunk |= BigInt(bioBytes[i + j]) << (BigInt(j) * BigInt(8));
      }
      serialized.push(chunk);
    }
  }
  
  return serialized;
}

/**
 * Encrypt user profile data using RescueCipher
 * Returns encrypted bytes ready for Solana transaction
 */
export async function encryptUserData(
  data: UserProfileData,
  cipher: RescueCipher,
  nonce?: Uint8Array
): Promise<{
  ciphertext: number[][];
  nonce: Uint8Array;
}> {
  // Generate nonce if not provided
  const nonceBytes = nonce || new Uint8Array(16);
  if (!nonce) {
    // Use crypto.getRandomValues for secure random bytes
    if (typeof window !== 'undefined' && window.crypto) {
      crypto.getRandomValues(nonceBytes);
    } else {
      // Fallback for Node.js
      for (let i = 0; i < 16; i++) {
        nonceBytes[i] = Math.floor(Math.random() * 256);
      }
    }
  }
  
  // Serialize to bigints
  const serialized = serializeUserData(data);
  
  // Encrypt using RescueCipher
  const encrypted = cipher.encrypt(serialized, nonceBytes);
  
  // Validation: encrypted data must fit in 512 bytes (UserProfile.encrypted_data max)
  const totalBytes = encrypted.flat().length;
  if (totalBytes > 512) {
    throw new Error(
      `Encrypted user data too large: ${totalBytes} bytes (max 512). ` +
      `Consider reducing bio/display name length.`
    );
  }
  
  return {
    ciphertext: encrypted,
    nonce: nonceBytes,
  };
}

/**
 * Decrypt and deserialize user profile data
 * Used for reading own profile or decrypted matches
 */
export async function decryptUserData(
  encryptedData: number[][],
  cipher: RescueCipher,
  nonce: Uint8Array
): Promise<UserProfileData> {
  // Decrypt using RescueCipher
  const decrypted = cipher.decrypt(encryptedData, nonce);
  
  // Parse interests from first bigint (32 bits)
  const interestBits = decrypted[0].toString(2).padStart(32, '0');
  const interests: InterestTag[] = [];
  
  for (let i = 0; i < MAX_INTERESTS; i++) {
    if (interestBits[i] === '1') {
      // i is the InterestTag enum value (0-31)
      interests.push(i as InterestTag);
    }
  }
  
  // Parse optional display name (from bigints 1+)
  let displayName: string | undefined;
  let bio: string | undefined;
  
  if (decrypted.length > 1) {
    // For simplicity, assume next few bigints are display name
    // In production, you'd need length prefixes or delimiters
    const nameBytes: number[] = [];
    for (let i = 1; i < Math.min(decrypted.length, 5); i++) {
      for (let j = 0; j < 8; j++) {
        const byte = Number((decrypted[i] >> (BigInt(j) * BigInt(8))) & BigInt(0xFF));
        if (byte !== 0) nameBytes.push(byte);
      }
    }
    if (nameBytes.length > 0) {
      displayName = new TextDecoder().decode(new Uint8Array(nameBytes));
    }
  }
  
  return {
    interests,
    displayName,
    bio,
  };
}

/**
 * Helper: Convert InterestTag array to human-readable string
 */
export function interestsToString(interests: InterestTag[]): string {
  return interests.join(', ');
}

/**
 * Helper: Validate interests are within allowed categories
 */
export function validateInterests(interests: string[]): InterestTag[] {
  const validated: InterestTag[] = [];
  
  interests.forEach(interest => {
    const numericValue = parseInt(interest, 10);
    // Check if it's a valid InterestTag enum value (0-31)
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue < MAX_INTERESTS) {
      validated.push(numericValue as InterestTag);
    } else {
      console.warn(`Invalid interest category: ${interest}`);
    }
  });
  
  return validated;
}
