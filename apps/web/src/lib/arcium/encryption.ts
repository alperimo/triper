/**
 * Client-side encryption utilities for Arcium MPC
 * Uses x25519 key exchange + RescueCipher for end-to-end encryption
 * 
 * MUST match encrypted-ixs/src/trip_matching.rs TripData structure EXACTLY
 */

import { x25519, RescueCipher, getMXEPublicKey } from '@arcium-hq/client';
import { AnchorProvider, web3 } from '@coral-xyz/anchor';
import { latLngToCell, routeToCells } from '@/lib/geo/grid';
import type { GridCell } from '@/types';

// Constants from Rust circuit
const MAX_WAYPOINTS = 20;
const MAX_INTERESTS = 32;

/**
 * Grid cell matching Rust circuit structure
 * Uses integer coordinates for MPC compatibility
 */
interface MpcGridCell {
  x: number; // i32 in Rust
  y: number; // i32 in Rust
}

/**
 * TripData structure EXACTLY matching Rust circuit in encrypted-ixs/src/trip_matching.rs
 * 
 * pub struct TripData {
 *     grid_cells: [GridCell; MAX_WAYPOINTS],
 *     cell_count: u8,
 *     start_date: i64,
 *     end_date: i64,
 *     interests: [bool; 32],
 * }
 */
export interface TripData {
  gridCells: MpcGridCell[];  // Will be padded to MAX_WAYPOINTS
  startDate: Date;
  endDate: Date;
  interests: string[];       // Will be converted to bool[32]
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
 * MUST match encrypted-ixs/src/trip_matching.rs TripData struct EXACTLY
 * 
 * Rust structure:
 * pub struct TripData {
 *     grid_cells: [GridCell; 20],
 *     cell_count: u8,
 *     start_date: i64,
 *     end_date: i64,
 *     interests: [bool; 32],
 * }
 */
export function serializeTripData(data: TripData): bigint[] {
  const serialized: bigint[] = [];
  
  // 1. Grid cells (20 cells, each with x and y coordinates)
  const paddedCells = padGridCells(data.gridCells);
  for (const cell of paddedCells) {
    serialized.push(BigInt(cell.x));
    serialized.push(BigInt(cell.y));
  }
  
  // 2. Cell count (u8)
  serialized.push(BigInt(Math.min(data.gridCells.length, MAX_WAYPOINTS)));
  
  // 3. Start date (i64 - Unix timestamp in seconds)
  serialized.push(BigInt(Math.floor(data.startDate.getTime() / 1000)));
  
  // 4. End date (i64 - Unix timestamp in seconds)
  serialized.push(BigInt(Math.floor(data.endDate.getTime() / 1000)));
  
  // 5. Interests (32 booleans as bits)
  const interestBools = convertInterestsToBoolArray(data.interests);
  for (const flag of interestBools) {
    serialized.push(flag ? BigInt(1) : BigInt(0));
  }
  
  return serialized;
}

/**
 * Pad grid cells to MAX_WAYPOINTS with zeros
 */
function padGridCells(cells: MpcGridCell[]): MpcGridCell[] {
  const padded: MpcGridCell[] = [];
  
  // Add actual cells (up to MAX_WAYPOINTS)
  for (let i = 0; i < MAX_WAYPOINTS; i++) {
    if (i < cells.length) {
      padded.push(cells[i]);
    } else {
      padded.push({ x: 0, y: 0 }); // Padding
    }
  }
  
  return padded;
}

/**
 * Convert lat/lng coordinates to integer grid cells for MPC
 * Scales coordinates to integer grid (e.g., 0.001 degree precision = ~111 meters)
 */
export function convertRouteToGridCells(route: Array<{ lat: number; lng: number }>): MpcGridCell[] {
  return route.map(point => ({
    // Scale to integer grid with ~100m precision
    // Multiply by 1000 to preserve 3 decimal places
    x: Math.floor(point.lat * 1000),
    y: Math.floor(point.lng * 1000),
  }));
}

/**
 * Convert interest strings to boolean array[32]
 * Maps known interests to fixed positions
 */
function convertInterestsToBoolArray(interests: string[]): boolean[] {
  const bools = new Array(MAX_INTERESTS).fill(false);
  
  // Interest category mapping (must match Rust circuit expectations)
  const interestMap: Record<string, number> = {
    adventure: 0,
    culture: 1,
    food: 2,
    nature: 3,
    nightlife: 4,
    relaxation: 5,
    shopping: 6,
    sports: 7,
    beach: 8,
    mountains: 9,
    cities: 10,
    rural: 11,
    photography: 12,
    wellness: 13,
    history: 14,
    art: 15,
    music: 16,
    festivals: 17,
    wildlife: 18,
    diving: 19,
    skiing: 20,
    hiking: 21,
    biking: 22,
    camping: 23,
    luxury: 24,
    budget: 25,
    family: 26,
    solo: 27,
    couples: 28,
    groups: 29,
    backpacking: 30,
    roadtrip: 31,
  };
  
  for (const interest of interests) {
    const pos = interestMap[interest.toLowerCase()];
    if (pos !== undefined && pos < MAX_INTERESTS) {
      bools[pos] = true;
    }
  }
  
  return bools;
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
 * Compute SHA-256 hash of route for on-chain storage
 * This is NOT encrypted, just a commitment to the route
 * Returns 32-byte array for Solana program
 */
export async function hashRouteForChain(
  route: Array<{ lat: number; lng: number }>
): Promise<Uint8Array> {
  const gridCells = convertRouteToGridCells(route);
  const cellData = gridCells.map(c => `${c.x},${c.y}`).join('|');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(cellData);
  
  // Use Web Crypto API for SHA-256  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as unknown as BufferSource);
  return new Uint8Array(hashBuffer);
}
