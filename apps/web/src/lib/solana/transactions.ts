// Solana transaction helpers for Triper contract
import { 
  Connection, 
  Transaction, 
  PublicKey, 
  SystemProgram,
  TransactionInstruction,
  Keypair,
  sendAndConfirmTransaction
} from '@solana/web3.js';

// TODO: Update with actual deployed program ID
export const TRIPER_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');

export interface CreateTripParams {
  userPublicKey: PublicKey;
  tripId: string;
  encryptedRouteHash: string;
  startDate: number; // Unix timestamp
  endDate: number;
}

export interface AcceptMatchParams {
  userPublicKey: PublicKey;
  matchId: string;
  tripId: string;
}

/**
 * Create a trip on Solana blockchain
 */
export async function createTripTransaction(
  connection: Connection,
  params: CreateTripParams
): Promise<Transaction> {
  const transaction = new Transaction();
  
  // TODO: Replace with actual program instruction
  // This is a placeholder showing the structure
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: params.userPublicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: TRIPER_PROGRAM_ID,
    data: Buffer.from(
      JSON.stringify({
        instruction: 'create_trip',
        tripId: params.tripId,
        routeHash: params.encryptedRouteHash,
        startDate: params.startDate,
        endDate: params.endDate,
      })
    ),
  });
  
  transaction.add(instruction);
  
  return transaction;
}

/**
 * Accept a match on Solana blockchain
 */
export async function acceptMatchTransaction(
  connection: Connection,
  params: AcceptMatchParams
): Promise<Transaction> {
  const transaction = new Transaction();
  
  // TODO: Replace with actual program instruction
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: params.userPublicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: TRIPER_PROGRAM_ID,
    data: Buffer.from(
      JSON.stringify({
        instruction: 'accept_match',
        matchId: params.matchId,
        tripId: params.tripId,
      })
    ),
  });
  
  transaction.add(instruction);
  
  return transaction;
}

/**
 * Get trip data from blockchain
 */
export async function getTripData(
  connection: Connection,
  tripId: string
): Promise<{
  owner: PublicKey;
  routeHash: string;
  startDate: number;
  endDate: number;
  isActive: boolean;
} | null> {
  // TODO: Implement actual account fetching
  console.log('Fetching trip data:', tripId);
  
  return null;
}

/**
 * Get match data from blockchain
 */
export async function getMatchData(
  connection: Connection,
  matchId: string
): Promise<{
  tripA: string;
  tripB: string;
  matchScore: number;
  userAAccepted: boolean;
  userBAccepted: boolean;
  revealedAt: number | null;
} | null> {
  // TODO: Implement actual account fetching
  console.log('Fetching match data:', matchId);
  
  return null;
}

/**
 * Send and confirm a transaction
 */
export async function sendTransaction(
  connection: Connection,
  transaction: Transaction,
  signers: Keypair[]
): Promise<string> {
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    signers,
    {
      commitment: 'confirmed',
    }
  );
  
  return signature;
}

/**
 * Helper to get Solana connection
 */
export function getSolanaConnection(cluster: 'devnet' | 'mainnet-beta' = 'devnet'): Connection {
  const endpoint = cluster === 'devnet' 
    ? 'https://api.devnet.solana.com'
    : 'https://api.mainnet-beta.solana.com';
    
  return new Connection(endpoint, 'confirmed');
}
