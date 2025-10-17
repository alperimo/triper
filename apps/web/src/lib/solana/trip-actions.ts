/**
 * Solana Transactions - Trip Management
 * Stores encrypted trip data with public destination hash for pre-filtering
 * 
 * Security Model:
 * - createTrip: Stores encrypted_data (209 bytes) + destination_grid_hash (public)
 * - destination_grid_hash: H3 level 6 cell (~36 km²) for pre-filtering
 * - encrypted_data: Full TripData encrypted with x25519 + RescueCipher
 * - Trip metadata is public (created_at, is_active)
 */

import { AnchorProvider, Program, web3, BN } from '@coral-xyz/anchor';
import type { Triper } from '../anchor/types';
import {
  initializeEncryption,
  encryptTripData,
  computePublicDestinationHash,
  type TripData,
} from '../arcium/encryption';
import type { Waypoint, InterestTag } from '@/types';

/**
 * Create a new trip on-chain
 * 
 * What's stored on-chain:
 * - owner: User's wallet address (PUBLIC)
 * - destination_grid_hash: H3 level 6 cell (PUBLIC - for pre-filtering)
 * - start_date, end_date: Unix timestamps (PUBLIC - for date filtering)
 * - encrypted_waypoints: WaypointData encrypted (PRIVATE)
 * - created_at: Timestamp (PUBLIC)
 * - is_active: Boolean flag (PUBLIC)
 * 
 * What's in encrypted_waypoints (PRIVATE):
 * - waypoints: Array of H3 cells (up to 20)
 * - waypoint_count: u8
 * 
 * What's in UserProfile.encrypted_data (PRIVATE - separate account):
 * - interests: Boolean array[32]
 * 
 * @param program - Triper program instance
 * @param provider - Anchor provider
 * @param waypoints - Route waypoints (will be converted to H3)
 * @param destination - Final destination (used for public hash)
 * @param startDate - Trip start date (stored PUBLIC for filtering)
 * @param endDate - Trip end date (stored PUBLIC for filtering)
 * @returns Transaction signature and trip PDA
 */
export async function createTrip(
  program: Program<Triper>,
  provider: AnchorProvider,
  waypoints: Waypoint[],
  destination: Waypoint,
  startDate: Date,
  endDate: Date
): Promise<{
  signature: string;
  tripPDA: web3.PublicKey;
  destinationGridHash: string;
}> {
  const owner = program.provider.publicKey;
  
  if (!owner) {
    throw new Error('Wallet not connected');
  }
  
  // 1. Compute public destination hash (H3 level 6 for pre-filtering)
  const destinationGridHash = computePublicDestinationHash(destination);
  
  // 2. Initialize encryption context
  const encryptionContext = await initializeEncryption(provider, program.programId);
  
  // 3. Prepare TripData
  const tripData: TripData = {
    waypoints,
  };
  
  // 4. Encrypt trip data
  const encrypted = encryptTripData(encryptionContext, tripData);
  
  // 5. Flatten ciphertext to bytes
  // cipher.encrypt() returns number[][] (array of field elements)
  // We need to concatenate them into a single byte buffer
  const encryptedDataBytes = Buffer.concat(
    encrypted.ciphertext.map(field => Buffer.from(field))
  );
  
  console.log(`Encrypted data size: ${encryptedDataBytes.length} bytes (${encrypted.ciphertext.length} field elements)`);
  
  // 6. Convert destination grid hash to bytes[32]
  const destinationHashBytes = new Uint8Array(32);
  const encoder = new TextEncoder();
  const hashData = encoder.encode(destinationGridHash);
  destinationHashBytes.set(hashData.slice(0, 32));
  
  // 7. Derive Trip PDA
  // Updated to match current program: seeds = [b"trip", user.key().as_ref(), start_date.to_le_bytes().as_ref()]
  const startDateBytes = Buffer.alloc(8);
  startDateBytes.writeBigInt64LE(BigInt(Math.floor(startDate.getTime() / 1000)));
  
  const [tripPDA] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('trip'),
      owner.toBuffer(),
      startDateBytes,
    ],
    program.programId
  );
  
  console.log('📍 Creating trip on-chain');
  console.log('  Owner:', owner.toString());
  console.log('  Trip PDA:', tripPDA.toString());
  console.log('  Destination Hash:', destinationGridHash);
  console.log('  Waypoints:', waypoints.length);
  console.log('  Date Range:', startDate.toISOString(), '→', endDate.toISOString());
  console.log('  Encrypted waypoints:', encryptedDataBytes.length, 'bytes');
  
  // 8. Submit transaction
  const signature = await program.methods
    .createTrip(
      Array.from(destinationHashBytes),
      new BN(Math.floor(startDate.getTime() / 1000)),
      new BN(Math.floor(endDate.getTime() / 1000)),
      encryptedDataBytes,
      Array.from(encrypted.publicKey)
    )
    .accountsPartial({
      user: owner,
      trip: tripPDA,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc({ commitment: 'confirmed' });
  
  console.log('✅ Trip created:', signature);
  
  return {
    signature,
    tripPDA,
    destinationGridHash,
  };
}

/**
 * Deactivate a trip (stop matching)
 * PUBLIC transaction
 */
export async function deactivateTrip(
  program: Program<Triper>,
  tripPDA: web3.PublicKey
): Promise<string> {
  const owner = program.provider.publicKey;
  
  if (!owner) {
    throw new Error('Wallet not connected');
  }
  
  console.log('🛑 Deactivating trip:', tripPDA.toString());
  
  const signature = await program.methods
    .deactivateTrip()
    .accounts({
      trip: tripPDA,
      user: owner,
    })
    .rpc({ commitment: 'confirmed' });
  
  console.log('✅ Trip deactivated:', signature);
  
  return signature;
}

/**
 * Fetch trip data from blockchain
 * Returns only PUBLIC metadata (encrypted_data is private)
 */
export async function fetchTrip(
  program: Program<Triper>,
  tripPDA: web3.PublicKey
): Promise<{
  owner: web3.PublicKey;
  destinationGridHash: number[];
  startDate: number;
  endDate: number;
  encryptedData: number[];
  publicKey: number[];
  isActive: boolean;
  matchCount: number;
  createdAt: number;
  bump: number;
} | null> {
  try {
    const trip = await program.account.trip.fetch(tripPDA);
    
    return {
      owner: trip.owner,
      destinationGridHash: Array.from(trip.destinationGridHash),
      startDate: trip.startDate.toNumber(),
      endDate: trip.endDate.toNumber(),
      encryptedData: Array.from(trip.encryptedData),
      publicKey: Array.from(trip.publicKey),
      isActive: trip.isActive,
      matchCount: trip.matchCount,
      createdAt: trip.createdAt.toNumber(),
      bump: trip.bump,
    };
  } catch (error) {
    console.error('Error fetching trip:', error);
    return null;
  }
}

/**
 * Get all active trips for a user
 */
export async function getUserTrips(
  program: Program<Triper>,
  userPublicKey: web3.PublicKey
): Promise<Array<{
  address: web3.PublicKey;
  data: any;
}>> {
  const trips = await program.account.trip.all([
    {
      memcmp: {
        offset: 8, // After discriminator
        bytes: userPublicKey.toBase58(),
      },
    },
  ]);
  
  return trips.map(trip => ({
    address: trip.publicKey,
    data: trip.account,
  }));
}
