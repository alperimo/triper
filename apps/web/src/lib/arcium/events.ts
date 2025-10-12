/**
 * Arcium MPC Event Listener
 * Listens for MatchComputedEvent from MPC callback
 * 
 * After Arcium MPC completes computation, it calls back to the program
 * which emits an event with the match scores
 */

import { AnchorProvider, BN, EventParser, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import type { Triper } from '../anchor/types';

/**
 * Match computation result from MPC
 */
export interface MatchResult {
  computationAccount: PublicKey;
  routeScore: number;
  dateScore: number;
  interestScore: number;
  totalScore: number;
  timestamp: number;
}

/**
 * Listen for match computed events
 * 
 * @param program - Anchor program instance
 * @param computationAccount - The computation account to watch
 * @param timeoutMs - How long to wait before giving up
 * @returns Match result or null if timeout
 */
export async function awaitMatchResult(
  program: Program<Triper>,
  computationAccount: PublicKey,
  timeoutMs: number = 60000 // 60 seconds default
): Promise<MatchResult | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      if (listener) {
        program.removeEventListener(listener);
      }
      resolve(null);
    }, timeoutMs);
    
    // Listen for MatchComputedEvent
    const listener = program.addEventListener('matchComputedEvent', (event: any) => {
      console.log('📊 Match result received from Arcium MPC:', event);
      
      // Check if this event is for our computation
      if (event.computationAccount.equals(computationAccount)) {
        clearTimeout(timeout);
        program.removeEventListener(listener);
        
        resolve({
          computationAccount: event.computationAccount,
          routeScore: event.routeScore,
          dateScore: event.dateScore,
          interestScore: event.interestScore,
          totalScore: event.totalScore,
          timestamp: Date.now(),
        });
      }
    });
    
    console.log('👂 Listening for MPC callback event...');
    console.log('  Computation Account:', computationAccount.toString());
    console.log('  Timeout:', timeoutMs / 1000, 'seconds');
  });
}

/**
 * Get all match events for a user's trips
 * Useful for displaying match history
 */
export async function getMatchHistory(
  program: Program<Triper>,
  userPublicKey: PublicKey
): Promise<MatchResult[]> {
  try {
    // Fetch recent transactions and parse events
    const signatures = await program.provider.connection.getSignaturesForAddress(
      program.programId,
      { limit: 100 }
    );
    
    const matches: MatchResult[] = [];
    
    for (const sig of signatures) {
      try {
        const tx = await program.provider.connection.getTransaction(sig.signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });
        
        if (!tx) continue;
        
        // Parse events from transaction
        const eventParser = new EventParser(
          program.programId,
          program.coder
        );
        
        const events = eventParser.parseLogs(tx.meta?.logMessages || []);
        
        for (const event of events) {
          if (event.name === 'matchComputedEvent') {
            matches.push({
              computationAccount: event.data.computationAccount,
              routeScore: event.data.routeScore,
              dateScore: event.data.dateScore,
              interestScore: event.data.interestScore,
              totalScore: event.data.totalScore,
              timestamp: (tx.blockTime || 0) * 1000,
            });
          }
        }
      } catch (err) {
        // Skip failed transactions
        continue;
      }
    }
    
    return matches;
  } catch (error) {
    console.error('Error fetching match history:', error);
    return [];
  }
}

/**
 * Subscribe to all match events in real-time
 * Returns unsubscribe function
 */
export function subscribeToMatchEvents(
  program: Program<Triper>,
  onMatch: (match: MatchResult) => void
): () => void {
  const listener = program.addEventListener('matchComputedEvent', (event: any) => {
    onMatch({
      computationAccount: event.computationAccount,
      routeScore: event.routeScore,
      dateScore: event.dateScore,
      interestScore: event.interestScore,
      totalScore: event.totalScore,
      timestamp: Date.now(),
    });
  });
  
  console.log('👂 Subscribed to all match events');
  
  return () => {
    program.removeEventListener(listener);
    console.log('🔇 Unsubscribed from match events');
  };
}
