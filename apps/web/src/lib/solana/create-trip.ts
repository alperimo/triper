/**
 * Solana Transactions - Trip Management
 * PUBLIC transactions (non-encrypted)
 * 
 * Security Model:
 * - createTrip: Stores ONLY route_hash (commitment), NOT actual route
 * - Trip metadata is public (created_at, is_active, computation_count)
 * - Actual trip data (route, dates, interests) stays encrypted client-side
 */

import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor';
import type { Triper } from '../anchor/types';
import { hashRouteForChain } from '../arcium/encryption';

/**
 * Create a new trip on-chain
 * 
 * What's stored on-chain (PUBLIC):
 * - owner: User's wallet address
 * - route_hash: SHA-256 commitment to route (NOT the actual route!)
 * - created_at: Timestamp
 * - is_active: Boolean flag
 * - computation_count: Number of matches computed
 * 
 * What's NOT stored (PRIVATE):
 * - Actual route coordinates
 * - Travel dates
 * - Interest preferences
 * 
 * @param program - Triper program instance
 * @param route - Raw route coordinates (will be hashed, NOT stored)
 * @returns Transaction signature and trip PDA
 */
export async function createTrip(
  program: Program<Triper>,
  route: Array<{ lat: number; lng: number }>
): Promise<{
  signature: string;
  tripPDA: web3.PublicKey;
  routeHash: Uint8Array;
}> {
  const owner = program.provider.publicKey;
  
  if (!owner) {
    throw new Error('Wallet not connected');
  }
  
  // Hash the route (commitment, NOT actual route data)
  const routeHash = await hashRouteForChain(route);
  
  // Derive Trip PDA
  const [tripPDA, bump] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('trip'),
      owner.toBuffer(),
      Buffer.from(routeHash),
    ],
    program.programId
  );
  
  console.log('📍 Creating trip on-chain (public metadata only)');
  console.log('  Owner:', owner.toString());
  console.log('  Trip PDA:', tripPDA.toString());
  console.log('  Route Hash:', Buffer.from(routeHash).toString('hex').slice(0, 16) + '...');
  
  // Submit transaction
  const signature = await program.methods
    .createTrip(Array.from(routeHash) as any)
    .accountsPartial({
      user: owner,
    })
    .rpc({ commitment: 'confirmed' });
  
  console.log('✅ Trip created:', signature);
  
  return {
    signature,
    tripPDA,
    routeHash,
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
