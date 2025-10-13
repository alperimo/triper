import { useCallback, useEffect, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { useMatchStore } from '@/lib/store/match';
import { 
  createPrefilterService, 
  getDefaultPrefilterConfig,
  type TripCandidate 
} from '@/lib/services/prefilter';
import { computeTripMatch } from '@/lib/arcium/compute-match';
import type { TripData } from '@/lib/arcium/encryption';
import type { Match, Trip } from '@/types';
import IDL from '@/lib/anchor/triper.json';
import type { Triper } from '@/lib/anchor/types';
import { showError, showLoading, updateToast, showMatchFound, showWalletRequired, showSuccess } from '@/lib/toast';

// TODO: Move to env config
const PROGRAM_ID = new PublicKey(IDL.address);

/**
 * Map on-chain match status to UI status
 */
function mapMatchStatus(onChainStatus: any): Match['status'] {
  // Based on Rust enum: Pending, Computed, Mutual, Revealed, Expired
  if (onChainStatus.pending) return 'pending';
  if (onChainStatus.computed) return 'viewed';
  if (onChainStatus.mutual) return 'mutual';
  if (onChainStatus.revealed) return 'revealed';
  if (onChainStatus.expired) return 'expired';
  return 'pending';
}

export function useMatches() {
  const { matches, setMatches, addMatch, setLoading: setStoreLoading } = useMatchStore();
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  /**
   * Fetch all match records from blockchain
   */
  const fetchMatches = useCallback(async () => {
    if (!wallet) {
      console.warn('Wallet not connected, cannot fetch matches');
      showWalletRequired();
      return;
    }
    
    setLocalLoading(true);
    setStoreLoading(true);
    setError(null);
    
    try {
      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program<Triper>(IDL as any, provider);
      
      // Fetch all match records where user is involved
      const matchRecords = await program.account.matchRecord.all([
        {
          memcmp: {
            offset: 8 + 32, // After discriminator + trip_a
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ]);
      
      // Convert to Match format
      const formattedMatches: Match[] = matchRecords.map((record: any) => ({
        id: record.publicKey.toString(),
        tripAId: record.account.tripA.toString(),
        tripBId: record.account.tripB.toString(),
        matchScore: 0, // TODO: Calculate from scores
        routeOverlap: record.account.routeScore || 0,
        proximityScore: 0,
        proximity: 'Unknown',
        dateOverlap: record.account.dateScore || 0,
        interestSimilarity: record.account.interestScore || 0,
        status: mapMatchStatus(record.account.status),
        createdAt: new Date(record.account.createdAt * 1000),
        revealedToA: false, // TODO: Implement reveal logic
        revealedToB: false,
      }));
      
      setMatches(formattedMatches);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      showError('Failed to load matches');
    } finally {
      setLocalLoading(false);
      setStoreLoading(false);
    }
  }, [wallet, connection, setMatches, setStoreLoading]);

  /**
   * Find matches for a trip using pre-filtering + MPC
   * 
   * Process:
   * 1. Pre-filter candidates by destination + dates (cheap)
   * 2. Run MPC computation on top candidates (expensive)
   */
  const findMatches = useCallback(async (
    myTrip: Trip,
    myTripData: TripData,
    maxCandidates: number = 10
  ): Promise<void> => {
    if (!wallet) {
      showWalletRequired();
      throw new Error('Wallet not connected');
    }
    
    const toastId = showLoading('Finding matches...');
    setLocalLoading(true);
    setStoreLoading(true);
    setError(null);
    
    try {
      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program<Triper>(IDL as any, provider);
      
      // Step 1: Pre-filter candidates (off-chain, cheap)
      console.log('🔍 Pre-filtering candidates...');
      const config = getDefaultPrefilterConfig(
        connection.rpcEndpoint,
        PROGRAM_ID
      );
      const prefilter = createPrefilterService(config);
      
      const candidates = await prefilter.queryTrips({
        destinationGridHash: myTrip.destinationGridHash,
        startDate: myTrip.startDate,
        endDate: myTrip.endDate,
        excludeOwners: [wallet.publicKey.toString()],
        limit: 50, // Get more candidates, take top after
      });
      
      console.log(`✅ Found ${candidates.length} pre-filtered candidates`);
      
      if (candidates.length === 0) {
        updateToast(toastId, 'error', 'No matches found');
        console.log('No candidates found');
        return;
      }
      
      // Step 2: Run MPC computation on top candidates (on-chain, expensive)
      const topCandidates = candidates.slice(0, maxCandidates);
      console.log(`🔐 Running MPC on top ${topCandidates.length} candidates...`);
      
      for (const candidate of topCandidates) {
        try {
          // Fetch candidate's trip data
          const candidateTripPubkey = new PublicKey(candidate.tripId);
          const candidateTripAccount = await program.account.trip.fetch(candidateTripPubkey);
          
          // TODO: Decrypt candidateTripAccount.encryptedData
          // For now, we'll need to mock or skip this step
          // In production, we'd need access to their encrypted data
          
          console.log(`⏳ Computing match with ${candidate.tripId.slice(0, 8)}...`);
          
          // Note: We can't decrypt their data without their permission
          // So we'd need a different flow:
          // 1. Initiate match (creates MatchRecord)
          // 2. They accept
          // 3. Then run MPC with both encrypted datasets
          
          // For now, just log
          console.log('Match computation would run here');
          
        } catch (err) {
          console.error(`Failed to compute match with ${candidate.tripId}:`, err);
          // Continue with next candidate
        }
      }
      
      // Refresh matches after computations
      await fetchMatches();
      
      updateToast(toastId, 'success', `Found ${candidates.length} matches!`);
      showMatchFound(candidates.length);
      
    } catch (err) {
      console.error('Failed to find matches:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      updateToast(toastId, 'error', `Failed to find matches: ${error.message}`);
      throw err;
    } finally {
      setLocalLoading(false);
      setStoreLoading(false);
    }
  }, [wallet, connection, setStoreLoading, fetchMatches]);

  /**
   * Accept a match
   */
  const acceptMatch = useCallback(async (matchId: string) => {
    if (!wallet) {
      showWalletRequired();
      throw new Error('Wallet not connected');
    }
    
    const toastId = showLoading('Accepting match...');
    
    try {
      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program<Triper>(IDL as any, provider);
      
      const matchPubkey = new PublicKey(matchId);
      const matchAccount = await program.account.matchRecord.fetch(matchPubkey);
      
      await (program.methods as any)
        .acceptMatch()
        .accounts({
          matchAccount: matchPubkey,
          trip: matchAccount.tripA, // or tripB depending on user
          user: wallet.publicKey,
        })
        .rpc();
      
      console.log('✅ Match accepted:', matchId);
      updateToast(toastId, 'success', 'Match accepted!');
      
      // Refresh matches
      await fetchMatches();
    } catch (err) {
      console.error('Failed to accept match:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      updateToast(toastId, 'error', `Failed to accept match: ${error.message}`);
      throw err;
    }
  }, [wallet, connection, fetchMatches]);

  /**
   * Reject a match
   */
  const rejectMatch = useCallback(async (matchId: string) => {
    if (!wallet) {
      showWalletRequired();
      throw new Error('Wallet not connected');
    }
    
    try {
      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program<Triper>(IDL as any, provider);
      
      const matchPubkey = new PublicKey(matchId);
      
      // Note: There's no explicit reject instruction
      // We could implement one or just ignore the match client-side
      console.log('⚠️  Match rejected (client-side only):', matchId);
      
      // Remove from local state
      const updatedMatches = matches.filter(m => m.id !== matchId);
      setMatches(updatedMatches);
      
      showSuccess('Match rejected');
    } catch (err) {
      console.error('Failed to reject match:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      showError(`Failed to reject match: ${error.message}`);
      throw err;
    }
  }, [wallet, connection, matches, setMatches]);

  // Auto-fetch matches on mount
  useEffect(() => {
    if (wallet) {
      fetchMatches();
    }
  }, [wallet, fetchMatches]);

  return {
    matches,
    loading: localLoading,
    error,
    fetchMatches,
    findMatches,
    acceptMatch,
    rejectMatch,
  };
}
