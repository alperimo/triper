/**
 * Client-side encryption utilities for Arcium MPC
 * Uses x25519 key exchange + RescueCipher for end-to-end encryption
 * 
 * MUST match encrypted-ixs/src/trip_matching.rs TripData structure EXACTLY
 */

import { x25519, RescueCipher, getMXEPublicKey } from '@arcium-hq/client';
import { AnchorProvider, web3 } from '@coral-xyz/anchor';
import { waypointsToH3Cells, h3ToU64, computeDestinationHash } from '@/lib/geo/h3';
import type { H3Index, Waypoint, InterestTag } from '@/types';

// Constants from Rust circuit
const MAX_WAYPOINTS = 20;
const MAX_INTERESTS = 32; // DEPRECATED: Now in UserProfile

/**
 * TripData structure EXACTLY matching Rust circuit in encrypted-ixs/src/trip_matching.rs
 * 
 * - Waypoints: Encrypted in Trip.encrypted_waypoints (WaypointData struct)
 * - Interests: Encrypted in UserProfile.encrypted_data (UserInterests struct)
 * - Dates: Stored publicly in Trip (start_date, end_date fields)
 * 
 * pub struct WaypointData {
 *     waypoints: [u64; 20],      // H3 cells at resolution 7
 *     waypoint_count: u8,
 * }
 * 
 * Total size: 20*8 + 1 = 161 bytes
 */
export interface TripData {
  waypoints: Waypoint[];    // Will be converted to H3 cells and padded to 20
}

/**
 * Encryption context - stores keys and cipher
 */
export interface EncryptionContext {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  mxePublicKey: Uint8Array;
  cipher: RescueCipher;
}

/**
 * Initialize encryption context with MXE public key
 */
export async function initializeEncryption(
  provider: AnchorProvider,
  programId: web3.PublicKey
): Promise<EncryptionContext> {
  // Generate ephemeral keypair for this session
  const privateKey = x25519.utils.randomPrivateKey();
  const publicKey = x25519.getPublicKey(privateKey);
  
  // Get MXE public key from the network
  const mxePublicKey = await getMXEPublicKey(provider, programId);
  
  if (!mxePublicKey) {
    throw new Error('Failed to fetch MXE public key from network');
  }
  
  // Derive shared secret and create cipher
  const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
  const cipher = new RescueCipher(sharedSecret);
  
  return {
    privateKey,
    publicKey,
    mxePublicKey,
    cipher,
  };
}

/**
 * Serialize trip data to format expected by Arcium circuit
 * MUST match encrypted-ixs/src/trip_matching.rs WaypointData struct EXACTLY
 * 
 * Rust structure:
 * pub struct WaypointData {
 *     waypoints: [u64; 20],
 *     waypoint_count: u8,
 * }
 * 
 * NOTE: Dates are PUBLIC (stored in Trip.start_date, Trip.end_date)
 * NOTE: Interests are in UserProfile.encrypted_data (separate account)
 */
export function serializeTripData(data: TripData): bigint[] {
  const serialized: bigint[] = [];
  
  // 1. Convert waypoints to H3 cells
  const h3Cells = waypointsToH3Cells(data.waypoints);
  const actualWaypointCount = h3Cells.length;
  
  // Convert H3 cells to u64 and pad to MAX_WAYPOINTS
  for (let i = 0; i < MAX_WAYPOINTS; i++) {
    if (i < h3Cells.length) {
      serialized.push(h3ToU64(h3Cells[i]));
    } else {
      serialized.push(BigInt(0)); // Padding
    }
  }
  
  // 2. Waypoint count (u8)
  serialized.push(BigInt(actualWaypointCount));
  
  
  return serialized;
}


/**
 * Encrypt trip data using RescueCipher
 */
export function encryptTripData(
  context: EncryptionContext,
  data: TripData,
  nonce?: Uint8Array
): {
  ciphertext: number[][];
  nonce: Uint8Array;
  publicKey: Uint8Array;
} {
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
  
  const plaintext = serializeTripData(data);
  const ciphertext = context.cipher.encrypt(plaintext, nonceBytes);
  
  return {
    ciphertext,
    nonce: nonceBytes,
    publicKey: context.publicKey,
  };
}

/**
 * Compute destination grid hash for pre-filtering
 * Uses H3 level 6 (~36 km²) for coarse-grained location matching
 * This is public (not encrypted) for efficient filtering
 */
export function computePublicDestinationHash(destination: Waypoint): string {
  return computeDestinationHash(destination);
}
