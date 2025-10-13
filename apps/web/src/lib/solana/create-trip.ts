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

import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor';
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
 * - encrypted_data: Full TripData encrypted (PRIVATE)
 * - created_at: Timestamp (PUBLIC)
 * - is_active: Boolean flag (PUBLIC)
 * 
 * What's in encrypted_data (PRIVATE):
 * - waypoints: Array of H3 cells (up to 20)
 * - start_date, end_date: Unix timestamps
 * - interests: Boolean array[32]
 * 
 * @param program - Triper program instance
 * @param provider - Anchor provider
 * @param waypoints - Route waypoints (will be converted to H3)
 * @param destination - Final destination (used for public hash)
 * @param startDate - Trip start date
 * @param endDate - Trip end date
 * @param interests - Interest tags (0-31)
 * @returns Transaction signature and trip PDA
 */
export async function createTrip(
  program: Program<Triper>,
  provider: AnchorProvider,
  waypoints: Waypoint[],
  destination: Waypoint,
  startDate: Date,
  endDate: Date,
  interests: InterestTag[]
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
    startDate,
    endDate,
    interests,
  };
  
  // 4. Encrypt trip data
  const encrypted = encryptTripData(encryptionContext, tripData);
  
  // 5. Flatten ciphertext to bytes
  // TODO: Properly serialize ciphertext (currently simplified)
  const encryptedDataBytes = new Uint8Array(209); // Match circuit size
  let offset = 0;
  for (const chunk of encrypted.ciphertext) {
    for (const value of chunk) {
      if (offset < 209) {
        encryptedDataBytes[offset++] = Number(value) & 0xff;
      }
    }
  }
  
  // 6. Convert destination grid hash to bytes[32]
  const destinationHashBytes = new Uint8Array(32);
  const encoder = new TextEncoder();
  const hashData = encoder.encode(destinationGridHash);
  destinationHashBytes.set(hashData.slice(0, 32));
  
  // 7. Derive Trip PDA
  const [tripPDA] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('trip'),
      owner.toBuffer(),
      Buffer.from(destinationHashBytes),
    ],
    program.programId
  );
  
  console.log('📍 Creating trip on-chain');
  console.log('  Owner:', owner.toString());
  console.log('  Trip PDA:', tripPDA.toString());
  console.log('  Destination Hash:', destinationGridHash);
  console.log('  Waypoints:', waypoints.length);
  console.log('  Date Range:', startDate.toISOString(), '→', endDate.toISOString());
  console.log('  Interests:', interests.length);
  
  // 8. Submit transaction
  // Note: Type definitions may be outdated. The actual program expects:
  // create_trip(destination_grid_hash: [u8; 32], start_date: i64, end_date: i64, encrypted_data: Vec<u8>, public_key: [u8; 32])
  const signature = await (program.methods as any)
    .createTrip(
      Array.from(destinationHashBytes),
      Math.floor(startDate.getTime() / 1000),
      Math.floor(endDate.getTime() / 1000),
      Array.from(encryptedDataBytes),
      Array.from(encrypted.publicKey)
    )
    .accountsPartial({
      user: owner,
      trip: tripPDA,
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
 * Returns only PUBLIC metadata (route is NOT stored on-chain)
 */
export async function fetchTrip(
  program: Program<Triper>,
  tripPDA: web3.PublicKey
): Promise<{
  owner: web3.PublicKey;
  routeHash: number[];
  createdAt: number;
  isActive: boolean;
  computationCount: number;
} | null> {
  try {
    const trip = await program.account.trip.fetch(tripPDA);
    
    return {
      owner: trip.owner,
      routeHash: Array.from(trip.routeHash),
      createdAt: trip.createdAt.toNumber(),
      isActive: trip.isActive,
      computationCount: trip.computationCount,
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
