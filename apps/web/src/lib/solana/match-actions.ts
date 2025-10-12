/**
 * Solana Transactions - Match Actions
 * PUBLIC transactions for accepting/rejecting matches
 * 
 * Security Model:
 * - Match scores are PUBLIC (result of MPC computation)
 * - Accept/reject actions are PUBLIC (user consent)
 * - Actual trip data remains PRIVATE (never revealed)
 */

import { Program, web3 } from '@coral-xyz/anchor';
import type { Triper } from '../anchor/types';

/**
 * Accept a match
 * PUBLIC transaction - indicates user consent
 * 
 * Prerequisites:
 * - Match must exist (created by MPC callback)
 * - User must be owner of one of the trips
 * - Match score must meet threshold
 * 
 * @param program - Triper program instance
 * @param matchPDA - Match account address
 * @param tripPDA - User's trip account (for verification)
 * @returns Transaction signature
 */
export async function acceptMatch(
  program: Program<Triper>,
  matchPDA: web3.PublicKey,
  tripPDA: web3.PublicKey
): Promise<string> {
  const user = program.provider.publicKey;
  
  if (!user) {
    throw new Error('Wallet not connected');
  }
  
  console.log('✅ Accepting match');
  console.log('  Match Account:', matchPDA.toString());
  console.log('  Trip Account:', tripPDA.toString());
  
  const signature = await program.methods
    .acceptMatch()
    .accountsPartial({
      matchAccount: matchPDA,
      trip: tripPDA,
      user,
    })
    .rpc({ commitment: 'confirmed' });
  
  console.log('✅ Match accepted:', signature);
  
  return signature;
}

/**
 * Reject a match
 * PUBLIC transaction - indicates user declined
 */
export async function rejectMatch(
  program: Program<Triper>,
  matchPDA: web3.PublicKey,
  tripPDA: web3.PublicKey
): Promise<string> {
  const user = program.provider.publicKey;
  
  if (!user) {
    throw new Error('Wallet not connected');
  }
  
  console.log('❌ Rejecting match');
  console.log('  Match Account:', matchPDA.toString());
  console.log('  Trip Account:', tripPDA.toString());
  
  const signature = await program.methods
    .rejectMatch()
    .accountsPartial({
      matchAccount: matchPDA,
      trip: tripPDA,
      user,
    })
    .rpc({ commitment: 'confirmed' });
  
  console.log('❌ Match rejected:', signature);
  
  return signature;
}

/**
 * Record a match (called by backend after MPC computation)
 * This would typically be called by an authorized backend service
 * NOT by end users
 */
export async function recordMatch(
  program: Program<Triper>,
  tripA: web3.PublicKey,
  tripB: web3.PublicKey,
  totalScore: number,
  routeScore: number,
  dateScore: number,
  interestScore: number
): Promise<{
  signature: string;
  matchPDA: web3.PublicKey;
}> {
  const payer = program.provider.publicKey;
  
  if (!payer) {
    throw new Error('Wallet not connected');
  }
  
  // Derive Match PDA
  const [matchPDA] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('match'),
      tripA.toBuffer(),
      tripB.toBuffer(),
    ],
    program.programId
  );
  
  console.log('📊 Recording match on-chain');
  console.log('  Trip A:', tripA.toString());
  console.log('  Trip B:', tripB.toString());
  console.log('  Match PDA:', matchPDA.toString());
  console.log('  Total Score:', totalScore);
  
  const signature = await program.methods
    .recordMatch(
      totalScore,
      routeScore,
      dateScore,
      interestScore
    )
    .accountsPartial({
      matchAccount: matchPDA,
      tripA,
      tripB,
      authority: payer,
    })
    .rpc({ commitment: 'confirmed' });
  
  console.log('✅ Match recorded:', signature);
  
  return {
    signature,
    matchPDA,
  };
}

/**
 * Fetch match data from blockchain
 */
export async function fetchMatch(
  program: Program<Triper>,
  matchPDA: web3.PublicKey
): Promise<{
  tripA: web3.PublicKey;
  tripB: web3.PublicKey;
  totalScore: number;
  routeScore: number;
  dateScore: number;
  interestScore: number;
  userAAccepted: boolean;
  userBAccepted: boolean;
  revealedAt: number | null;
  createdAt: number;
} | null> {
  try {
    const match = await program.account.matchRecord.fetch(matchPDA);
    
    return {
      tripA: match.tripA,
      tripB: match.tripB,
      totalScore: match.totalScore,
      routeScore: match.routeScore,
      dateScore: match.dateScore,
      interestScore: match.interestScore,
      userAAccepted: match.tripAAccepted,
      userBAccepted: match.tripBAccepted,
      revealedAt: null, // Field doesn't exist in current structure
      createdAt: match.createdAt.toNumber(),
    };
  } catch (error) {
    console.error('Error fetching match:', error);
    return null;
  }
}

/**
 * Get all matches for a trip
 */
export async function getTripMatches(
  program: Program<Triper>,
  tripPDA: web3.PublicKey
): Promise<Array<{
  address: web3.PublicKey;
  data: any;
}>> {
  // Fetch all matches where this trip is either tripA or tripB
  const matchesA = await program.account.matchRecord.all([
    {
      memcmp: {
        offset: 8, // After discriminator
        bytes: tripPDA.toBase58(),
      },
    },
  ]);
  
  const matchesB = await program.account.matchRecord.all([
    {
      memcmp: {
        offset: 8 + 32, // After discriminator + tripA
        bytes: tripPDA.toBase58(),
      },
    },
  ]);
  
  // Combine and deduplicate
  const allMatches = [...matchesA, ...matchesB];
  const uniqueMatches = allMatches.filter((match, index, self) =>
    index === self.findIndex(m => m.publicKey.equals(match.publicKey))
  );
  
  return uniqueMatches.map(match => ({
    address: match.publicKey,
    data: match.account,
  }));
}
