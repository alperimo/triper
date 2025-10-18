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
import type { Waypoint, InterestTag, Trip } from '@/types';
import { getLightRpc, isAccountCompressed } from '../services/light-rpc';
import { generateCompressionProof, getLightProtocolAccounts } from '../services/light-compression';
import { CompressedAccountData } from '@lightprotocol/stateless.js';

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

/**
 * Get all archived (compressed) trips for a user
 * 
 * Fetches compressed trips from Light Protocol state tree.
 * These are trips that have been archived to save storage costs.
 * 
 * IMPORTANT: Compressed trips have DIFFERENT addresses than their original PDAs!
 * The original PDA is closed, and a new compressed address is created.
 * See TripCompressed event for address mapping.
 * 
 * @param programId - Triper program ID (to filter accounts)
 * @param userPublicKey - User's wallet address
 * @returns Array of archived trips with their compressed addresses
 */
export async function getUserArchivedTrips(
  programId: web3.PublicKey,
  userPublicKey: web3.PublicKey
): Promise<Array<{
  address: web3.PublicKey;
  data: CompressedAccountData;
}>> {
  try {
    const lightRpc = getLightRpc();
    
    // Fetch all compressed accounts owned by this user
    // Note: This returns ALL compressed accounts, we need to filter by program
    const result = await lightRpc.getCompressedAccountsByOwner(userPublicKey);
    
    console.log(`Found ${result.items.length} compressed accounts for user`);
    
    // TODO
    // Filter for Trip accounts (those created by our program)
    // Light Protocol stores the program ID in the account data
    const tripAccounts = result.items.filter((account) => {
      // Check if this compressed account belongs to our Triper program
      // The exact filtering logic depends on Light Protocol's account structure
      // You may need to check account.address.programId or similar
      return true; // TODO: Add proper filtering when Light Protocol is deployed
    });
    
    console.log(`Found ${tripAccounts.length} archived trips`);
    
    // Map compressed accounts to our trip format
    return tripAccounts.map((account) => ({
      address: account.owner, // Compressed address (different from original PDA!)
      data: account.data as CompressedAccountData, // Trip data (same structure as traditional)
    }));
  } catch (err) {
    console.error('Failed to fetch archived trips:', err);
    // If Light Protocol is not set up yet, return empty array
    return [];
  }
}

/**
 * Smart fetch: Try traditional first, fallback to compressed
 * 
 * This is the RECOMMENDED way to fetch trips in hybrid architecture.
 * No upfront compression checks - just try both sources automatically.
 * 
 * ARCHITECTURE:
 * - Traditional trips: Stored in standard Solana accounts (~$0.39/trip)
 * - Compressed trips: Stored in Light Protocol state tree (~$0.06/trip)
 * - Smart fetch tries traditional first (most common), then compressed
 * 
 * @param program - Triper program instance
 * @param tripPDA - Public key of the trip to fetch
 * @returns Trip data from either traditional or compressed storage
 * @throws Error if trip not found in either storage
 */
export async function fetchTripSmart(
  program: Program<Triper>,
  tripPDA: web3.PublicKey
): Promise<any> {
  try {
    // Try traditional account first (most common case, faster)
    return await program.account.trip.fetch(tripPDA);
  } catch (traditionalError) {
    // If traditional fails, try compressed
    console.log('Traditional fetch failed, trying compressed storage...', traditionalError);
    
    try {
      const lightRpc = getLightRpc();
      const compressedAccount = await lightRpc.getCompressedAccount(tripPDA);
      
      if (!compressedAccount) {
        throw new Error('Trip not found in traditional or compressed storage');
      }
      
      console.log('✅ Fetched trip from compressed storage:', tripPDA.toString());
      return compressedAccount;
    } catch (compressedError) {
      console.error('Compressed fetch also failed:', compressedError);
      throw new Error(`Trip ${tripPDA.toString()} not found in any storage`);
    }
  }
}

/**
 * Check if a trip can be updated
 * 
 * Compressed trips are READ-ONLY and cannot be updated.
 * Use this guard before any update operations.
 * 
 * @param tripPDA - Public key of the trip to check
 * @returns true if trip can be updated (exists and not compressed)
 */
export async function canUpdateTrip(tripPDA: web3.PublicKey): Promise<boolean> {
  try {
    const compressed = await isAccountCompressed(tripPDA);
    return !compressed;
  } catch (err) {
    console.error('Failed to check trip update status:', err);
    return false;
  }
}

/**
 * Archive a trip (convert from traditional to compressed)
 * 
 * This is a ONE-WAY, PERMANENT operation!
 * - Saves ~85% storage cost ($0.39 → $0.06 = $0.33 saved)
 * - Trip becomes READ-ONLY (cannot be updated)
 * - Cannot be reversed
 * - Emits TripCompressed event with both addresses
 * 
 * USE CASES:
 * - Manual: User clicks "Archive & Save $0.33" button
 * - Automatic: Trips >30 days past end_date
 * 
 * PROCESS:
 * 1. Generates ZK validity proof for compression
 * 2. Calls compress_trip instruction on Solana program
 * 3. Program creates compressed account in Light Protocol state tree
 * 4. Program closes traditional account (refunds rent)
 * 5. Program emits TripCompressed event with both addresses
 * 
 * NOTE: Compressed address will be DIFFERENT from traditional PDA!
 * Listen for TripCompressed event to get the new compressed address.
 * 
 * @param program - Triper program instance
 * @param provider - Anchor provider
 * @param tripPDA - Public key of the trip to archive
 * @returns Transaction signature
 */
export async function archiveTrip(
  program: Program<Triper>,
  provider: AnchorProvider,
  tripPDA: web3.PublicKey
): Promise<string> {
  // Check if already compressed
  if (await isAccountCompressed(tripPDA)) {
    throw new Error('Trip is already archived');
  }
  
  // Fetch current trip data to verify ownership
  const tripAccount = await program.account.trip.fetch(tripPDA);
  const owner = provider.wallet.publicKey;
  
  if (!tripAccount.owner.equals(owner)) {
    throw new Error('Only trip owner can archive their trip');
  }
  
  console.log('Archiving trip:', tripPDA.toString());
  console.log('Owner:', owner.toString());
  console.log('Destination:', Buffer.from(tripAccount.destinationGridHash as any).toString('hex').slice(0, 16));
  
  const { proof, addressTreeInfo } = await generateCompressionProof(tripPDA);
  const lightAccounts = getLightProtocolAccounts();
  
  const signature = await program.methods
    .compressTrip(
      proof,
      addressTreeInfo,
      0 // output_state_tree_index
    )
    .accounts({
      trip: tripPDA,
      owner: owner,
    })
    .remainingAccounts(lightAccounts)
    .rpc({ commitment: 'confirmed' });
  
  console.log('Trip compressed:', signature);
  
  return signature;
}

/**
 * Check if trips should be auto-archived
 * 
 * Archives trips that are >30 days past their end date.
 * 
 * COST SAVINGS EXAMPLE:
 * - Each archived trip saves $0.33 in storage costs
 * - 100K users with 2 old trips = $66K savings
 * - 1M users with 3 old trips = $990K savings
 * 
 * @param program - Triper program instance
 * @param provider - Anchor provider
 * @param trips - Array of trip PDAs to check
 * @returns Array of archived trip PDAs
 */
export async function autoArchiveOldTrips(
  program: Program<Triper>,
  provider: AnchorProvider,
  trips: Array<{ address: web3.PublicKey; data: any }>
): Promise<web3.PublicKey[]> {
  const archived: web3.PublicKey[] = [];
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  for (const trip of trips) {
    const tripEndTime = trip.data.endDate.toNumber() * 1000;
    
    // Archive if trip ended >30 days ago and not already compressed
    if (tripEndTime < thirtyDaysAgo && !trip.data.isActive) {
      const compressed = await isAccountCompressed(trip.address);
      
      if (!compressed) {
        console.log(`Auto-archiving old trip: ${trip.address.toString()} (ended ${new Date(tripEndTime).toLocaleDateString()})`);
        
        try {
          await archiveTrip(program, provider, trip.address);
          archived.push(trip.address);
        } catch (err) {
          console.error(`Failed to auto-archive trip ${trip.address.toString()}:`, err);
        }
      }
    }
  }
  
  return archived;
}

// Helpers

/**
 * Deserialize trip data from on-chain account to Trip type
 * 
 * This helper avoids code duplication between traditional and compressed trips.
 * Both storage types contain the same Trip data structure.
 * 
 * @param tripPDA - Public key of the trip (used as ID)
 * @param tripAccount - Raw trip account data from chain
 * @returns Formatted Trip object for frontend
 */
export function deserializeTrip(
  tripPDA: web3.PublicKey,
  tripAccount: any
): Trip {
  return {
    id: tripPDA.toString(),
    owner: tripAccount.owner.toString(),
    // Encrypted fields - need local storage or decryption
    waypoints: [], // TODO: Decrypt or load from local cache
    destination: { lat: 0, lng: 0 }, // TODO: Decrypt or load from local cache
    startDate: new Date(tripAccount.startDate * 1000),
    endDate: new Date(tripAccount.endDate * 1000),
    interests: [], // TODO: Decrypt or load from local cache
    travelStyle: 'adventure', // TODO: Store in local metadata
    isActive: tripAccount.isActive,
    createdAt: new Date(tripAccount.createdAt * 1000),
    destinationGridHash: Buffer.from(tripAccount.destinationGridHash).toString('hex'),
    encryptedData: tripAccount.encryptedData,
  };
}