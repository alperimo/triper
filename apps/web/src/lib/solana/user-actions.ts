/**
 * Solana Transactions - User Profile Management
 * Stores encrypted user interests and preferences in UserProfile account
 * 
 * Security Model:
 * - createOrUpdateUserProfile: Stores encrypted_data (up to 512 bytes)
 * - encrypted_data: UserProfileData encrypted with x25519 + RescueCipher
 * - User can update interests without creating new trips
 * - UserProfile is reused across all user's trips (cost savings)
 */

import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor';
import type { Triper } from '../anchor/types';
import {
  encryptUserData,
  type UserProfileData,
} from '../arcium/user-encryption';
import { RescueCipher } from '@arcium-hq/client';
import type { InterestTag } from '@/types';

/**
 * Get UserProfile PDA for a user
 */
export function getUserProfilePDA(
  programId: web3.PublicKey,
  userPublicKey: web3.PublicKey
): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from('user_profile'), userPublicKey.toBuffer()],
    programId
  );
}

/**
 * Create or update a user profile on-chain
 * 
 * What's stored on-chain:
 * - owner: User's wallet address (PUBLIC)
 * - encrypted_data: UserProfileData encrypted (PRIVATE)
 * - public_key: Encryption public key (PUBLIC)
 * - created_at/updated_at: Timestamps (PUBLIC)
 * - is_active: Boolean flag (PUBLIC)
 * 
 * What's in encrypted_data (PRIVATE):
 * - interests: Boolean array[32] (used in MPC matching)
 * - displayName: Optional user display name
 * - bio: Optional user bio
 * 
 * @param program - Triper program instance
 * @param provider - Anchor provider
 * @param cipher - RescueCipher instance (from encryption context)
 * @param publicKey - Encryption public key
 * @param interests - Interest tags
 * @param displayName - Optional display name
 * @param bio - Optional bio
 * @returns Transaction signature and UserProfile PDA
 */
export async function createOrUpdateUserProfile(
  program: Program<Triper>,
  provider: AnchorProvider,
  cipher: RescueCipher,
  publicKey: Uint8Array,
  interests: InterestTag[],
  displayName?: string,
  bio?: string
): Promise<{
  signature: string;
  userProfilePDA: web3.PublicKey;
}> {
  const owner = program.provider.publicKey;
  
  if (!owner) {
    throw new Error('Wallet not connected');
  }
  
  // 1. Prepare UserProfileData
  const profileData: UserProfileData = {
    interests,
    displayName,
    bio,
  };
  
  // 2. Encrypt user profile data
  const encrypted = await encryptUserData(profileData, cipher);
  
  // 3. Flatten ciphertext to Vec<u8> format expected by Solana
  const encryptedBytes = new Uint8Array(encrypted.ciphertext.flat());
  
  // 4. Get UserProfile PDA
  const [userProfilePDA, bump] = getUserProfilePDA(program.programId, owner);
  
  // 5. Check if profile already exists
  let profileExists = false;
  try {
    const existingProfile = await program.account.userProfile.fetch(userProfilePDA);
    profileExists = !!existingProfile;
  } catch (error) {
    // Profile doesn't exist yet
    profileExists = false;
  }
  
  // 6. Build instruction
  const publicKeyArray = Array.from(publicKey);
  
  let signature: string;
  
  if (profileExists) {
    // Update existing profile
    signature = await program.methods
      .updateUserProfile(
        Array.from(encryptedBytes),
        publicKeyArray
      )
      .accounts({
        userProfile: userProfilePDA,
        owner: owner,
      })
      .rpc();
      
    console.log('UserProfile updated:', userProfilePDA.toBase58());
  } else {
    // Create new profile
    signature = await program.methods
      .createUserProfile(
        Array.from(encryptedBytes),
        publicKeyArray
      )
      .accounts({
        userProfile: userProfilePDA,
        user: owner,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
      
    console.log('UserProfile created:', userProfilePDA.toBase58());
  }
  
  console.log('Encrypted data size:', encryptedBytes.length, 'bytes');
  console.log('Interests:', interests.join(', '));
  
  return {
    signature,
    userProfilePDA,
  };
}

/**
 * Fetch user profile from blockchain
 * 
 * @param program - Triper program instance
 * @param userPublicKey - User's wallet address
 * @returns UserProfile account data or null if not found
 */
export async function fetchUserProfile(
  program: Program<Triper>,
  userPublicKey: web3.PublicKey
): Promise<{
  address: web3.PublicKey;
  owner: web3.PublicKey;
  encryptedData: number[];
  publicKey: number[];
  createdAt: number;
  updatedAt: number;
  tripCount: number;
  totalMatches: number;
  isActive: boolean;
  bump: number;
} | null> {
  try {
    const [userProfilePDA] = getUserProfilePDA(program.programId, userPublicKey);
    const profile = await program.account.userProfile.fetch(userProfilePDA);
    
    return {
      address: userProfilePDA,
      owner: profile.owner,
      encryptedData: Array.from(profile.encryptedData as any),
      publicKey: Array.from(profile.publicKey as any),
      createdAt: (profile.createdAt as any).toNumber(),
      updatedAt: (profile.updatedAt as any).toNumber(),
      tripCount: profile.tripCount,
      totalMatches: profile.totalMatches,
      isActive: profile.isActive,
      bump: profile.bump,
    };
  } catch (error) {
    console.log('UserProfile not found for user:', userPublicKey.toBase58());
    return null;
  }
}

/**
 * Check if user has a profile
 * 
 * @param program - Triper program instance
 * @param userPublicKey - User's wallet address
 * @returns true if profile exists and is active
 */
export async function hasUserProfile(
  program: Program<Triper>,
  userPublicKey: web3.PublicKey
): Promise<boolean> {
  const profile = await fetchUserProfile(program, userPublicKey);
  return profile !== null && profile.isActive;
}

/**
 * Get user profile PDA address without fetching
 * Useful for building transactions
 * 
 * @param program - Triper program instance
 * @param userPublicKey - User's wallet address
 * @returns UserProfile PDA address
 */
export function getUserProfileAddress(
  program: Program<Triper>,
  userPublicKey: web3.PublicKey
): web3.PublicKey {
  const [pda] = getUserProfilePDA(program.programId, userPublicKey);
  return pda;
}
