/**
 * React Hook for Arcium MPC Operations
 * Uses the new proper implementations
 */

import { useState, useEffect } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { 
  initializeEncryption, 
  encryptTripData,
  convertRouteToGridCells,
  hashRouteForChain,
  type TripData,
  type EncryptionContext,
} from '@/lib/arcium/encryption';
import { computeTripMatch } from '@/lib/arcium/compute-match';
import { awaitMatchResult, type MatchResult } from '@/lib/arcium/events';
import { createTrip } from '@/lib/solana/create-trip';
import { acceptMatch, rejectMatch } from '@/lib/solana/match-actions';
import type { Triper } from '@/lib/anchor/types';
import triperIdl from '@/lib/anchor/triper.json';

interface UseArciumReturn {
  // Encryption
  initEncryption: () => Promise<EncryptionContext>;
  encryptTrip: (tripData: TripData) => Promise<{ ciphertext: number[][]; nonce: Uint8Array; publicKey: Uint8Array }>;
  
  // Trip Management
  createTripOnChain: (route: Array<{ lat: number; lng: number }>) => Promise<{ signature: string; tripPDA: PublicKey }>;
  
  // MPC Computation
  computeMatch: (tripA: TripData, tripB: TripData) => Promise<{ computationOffset: any; signature: string }>;
  waitForMatchResult: (computationAccount: PublicKey, timeoutMs?: number) => Promise<MatchResult | null>;
  
  // Match Actions
  acceptMatchOnChain: (matchPDA: PublicKey, tripPDA: PublicKey) => Promise<string>;
  rejectMatchOnChain: (matchPDA: PublicKey, tripPDA: PublicKey) => Promise<string>;
  
  // State
  isLoading: boolean;
  error: Error | null;
  program: Program<Triper> | null;
}

/**
 * Hook for Arcium MPC operations with proper wallet integration
 */
export function useArcium(): UseArciumReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [program, setProgram] = useState<Program<Triper> | null>(null);
  
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  // Initialize program when wallet connects
  useEffect(() => {
    if (wallet && connection) {
      const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
      const prog = new Program<Triper>(triperIdl as Triper, provider);
      setProgram(prog);
    } else {
      setProgram(null);
    }
  }, [wallet, connection]);

  const initEncryption = async (): Promise<EncryptionContext> => {
    if (!program) throw new Error('Wallet not connected');
    setIsLoading(true);
    setError(null);
    
    try {
      const context = await initializeEncryption(
        program.provider as AnchorProvider,
        program.programId
      );
      return context;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const encryptTrip = async (tripData: TripData) => {
    const context = await initEncryption();
    return encryptTripData(context, tripData);
  };

  const createTripOnChain = async (route: Array<{ lat: number; lng: number }>) => {
    if (!program) throw new Error('Wallet not connected');
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createTrip(program, route);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const computeMatch = async (tripA: TripData, tripB: TripData) => {
    if (!program) throw new Error('Wallet not connected');
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await computeTripMatch(
        program,
        program.provider as AnchorProvider,
        tripA,
        tripB
      );
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const waitForMatchResult = async (computationAccount: PublicKey, timeoutMs = 60000) => {
    if (!program) throw new Error('Wallet not connected');
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await awaitMatchResult(program, computationAccount, timeoutMs);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const acceptMatchOnChain = async (matchPDA: PublicKey, tripPDA: PublicKey) => {
    if (!program) throw new Error('Wallet not connected');
    setIsLoading(true);
    setError(null);
    
    try {
      const signature = await acceptMatch(program, matchPDA, tripPDA);
      return signature;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectMatchOnChain = async (matchPDA: PublicKey, tripPDA: PublicKey) => {
    if (!program) throw new Error('Wallet not connected');
    setIsLoading(true);
    setError(null);
    
    try {
      const signature = await rejectMatch(program, matchPDA, tripPDA);
      return signature;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initEncryption,
    encryptTrip,
    createTripOnChain,
    computeMatch,
    waitForMatchResult,
    acceptMatchOnChain,
    rejectMatchOnChain,
    isLoading,
    error,
    program,
  };
}
