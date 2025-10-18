import { useCallback, useEffect, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { useTripStore } from '@/lib/store/trip';
import { 
  createTrip as createTripOnChain,
  canUpdateTrip as canUpdateTripOnChain,
  archiveTrip as archiveTripOnChain,
  autoArchiveOldTrips as autoArchiveOldTripsOnChain,
  getUserTrips,
  getUserArchivedTrips,
  deserializeTrip,
} from '@/lib/solana/trip-actions';
import type { Trip, Waypoint, InterestTag } from '@/types';
import IDL from '@/lib/anchor/triper.json';
import type { Triper } from '@/lib/anchor/types';
import { showError, showLoading, updateToast, showTripCreated, showWalletRequired } from '@/lib/toast';
import { isAccountCompressed } from '@/lib/services/light-rpc';

export function useTrips() {
  const { myTrips, archivedTrips, addTrip, updateTrip, removeTrip, setMyTrips, setArchivedTrips } = useTripStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const fetchTrips = useCallback(async () => {
    if (!wallet) {
      console.warn('Wallet not connected, cannot fetch trips');
      showWalletRequired();
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program<Triper>(IDL as any, provider);
      
      // Fetch all traditional trip accounts owned by user
      const trips = await program.account.trip.all([
        {
          memcmp: {
            offset: 8, // Discriminator
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ]);
      
      const deserializedTrips: Trip[] = trips.map((trip) => 
        deserializeTrip(trip.publicKey, trip.account)
      );
      
      setMyTrips(deserializedTrips);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      showError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [wallet, connection, setMyTrips]);

  /**
   * Fetch archived (compressed) trips for the current user
   * 
   * Archived trips are stored in Light Protocol compressed state.
   * They have different addresses than their original PDAs!
   * 
   * NOTE: This will return empty array until Light Protocol is deployed.
   */
  const fetchArchivedTrips = useCallback(async () => {
    if (!wallet) {
      console.warn('Wallet not connected, cannot fetch archived trips');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program<Triper>(IDL as any, provider);
      
      // Fetch all compressed trip accounts via Light RPC
      const compressedTrips = await getUserArchivedTrips(
        program.programId,
        wallet.publicKey
      );
      
      // Convert to Trip format using shared deserializer
      const formattedArchivedTrips: Trip[] = compressedTrips.map((trip) => 
        deserializeTrip(trip.address, trip.data)
      );
      
      setArchivedTrips(formattedArchivedTrips);
      console.log(`✅ Loaded ${formattedArchivedTrips.length} archived trips`);
    } catch (err) {
      console.error('Failed to fetch archived trips:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      // Don't show error toast - Light Protocol might not be set up yet
      console.warn('Light Protocol may not be configured. Archived trips unavailable.');
    } finally {
      setLoading(false);
    }
  }, [wallet, connection, setArchivedTrips]);

  const createTrip = useCallback(async (
    waypoints: Waypoint[],
    destination: Waypoint,
    startDate: Date,
    endDate: Date,
    interests: InterestTag[],
    travelStyle: Trip['travelStyle'] = 'adventure'
  ) => {
    if (!wallet) {
      showWalletRequired();
      throw new Error('Wallet not connected');
    }
    
    const toastId = showLoading('Creating trip...');
    setLoading(true);
    setError(null);
    
    try {
      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program<Triper>(IDL as any, provider);
      
      // Create trip on-chain
      const result = await createTripOnChain(
        program,
        provider,
        waypoints,
        destination,
        startDate,
        endDate,
        interests
      );
      
      console.log('✅ Trip created on-chain:', result.tripPDA.toString());
      
      // Create Trip object for store
      const newTrip: Trip = {
        id: result.tripPDA.toString(),
        owner: wallet.publicKey.toString(),
        waypoints,
        destination,
        startDate,
        endDate,
        interests,
        travelStyle,
        isActive: true,
        createdAt: new Date(),
        destinationGridHash: result.destinationGridHash,
      };
      
      addTrip(newTrip);
      updateToast(toastId, 'success', 'Trip created successfully!');
      showTripCreated(newTrip.id);
      return newTrip;
    } catch (err) {
      console.error('Failed to create trip:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      updateToast(toastId, 'error', `Failed to create trip: ${error.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, connection, addTrip]);

  const updateTripData = useCallback(async (tripId: string, isActive: boolean) => {
    if (!wallet) {
      showWalletRequired();
      throw new Error('Wallet not connected');
    }
    
    const tripPDA = new PublicKey(tripId);
    
    // Guard: Check if trip is compressed (read-only)
    if (await isAccountCompressed(tripPDA)) {
      showError('Cannot update archived trip. Archived trips are read-only.');
      throw new Error('Cannot update compressed trip');
    }
    
    const toastId = showLoading('Updating trip...');
    setLoading(true);
    setError(null);
    
    try {
      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program<Triper>(IDL as any, provider);
      
      // Update trip on-chain (currently only isActive is updatable)
      await (program.methods as any)
        .updateTrip(isActive)
        .accounts({
          trip: tripPDA,
          owner: wallet.publicKey,
        })
        .rpc();
      
      updateTrip(tripId, { isActive });
      updateToast(toastId, 'success', 'Trip updated successfully!');
      console.log('✅ Trip updated:', tripId);
    } catch (err) {
      console.error('Failed to update trip:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      updateToast(toastId, 'error', `Failed to update trip: ${error.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, connection, updateTrip]);

  /**
   * Check if a trip can be updated
   * 
   * Compressed trips are READ-ONLY and cannot be updated.
   * Use this guard before any update operations.
   * 
   * @param tripPDA - Public key of the trip to check
   * @returns true if trip can be updated (exists and not compressed)
   */
  const canUpdateTrip = useCallback(async (tripPDA: PublicKey): Promise<boolean> => {
    // Delegate to trip-actions
    return canUpdateTripOnChain(tripPDA);
  }, []);

  /**
   * Archive a trip (convert from traditional to compressed)
   * 
   * This is a ONE-WAY, PERMANENT operation!
   * - Saves ~85% storage cost ($0.39 → $0.06 = $0.33 saved)
   * - Trip becomes READ-ONLY (cannot be updated)
   * - Cannot be reversed
   * 
   * USE CASES:
   * - Manual: User clicks "Archive & Save $0.33" button
   * - Automatic: Trips >30 days past end_date
   * 
   * @param tripId - Public key string of the trip to archive
   */
  const archiveTrip = useCallback(async (tripId: string) => {
    if (!wallet) {
      showWalletRequired();
      throw new Error('Wallet not connected');
    }
    
    const tripPDA = new PublicKey(tripId);
    
    // Check if already compressed
    if (await isAccountCompressed(tripPDA)) {
      showError('Trip is already archived');
      return;
    }
    
    const toastId = showLoading('Archiving trip... This will save $0.33 in storage costs!');
    setLoading(true);
    setError(null);
    
    try {
      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program<Triper>(IDL as any, provider);
      
      // Delegate to trip-actions
      await archiveTripOnChain(program, provider, tripPDA);
      
      updateToast(toastId, 'success', 'Archive feature coming soon! Will save $0.33 per trip.');
      
      // After compression, update local state
      // Trip remains in store but with read-only status
      updateTrip(tripId, { isActive: false });
      
    } catch (err) {
      console.error('Failed to archive trip:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      updateToast(toastId, 'error', `Failed to archive trip: ${error.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, connection, updateTrip]);

  /**
   * Check if trips should be auto-archived
   * 
   * Archives trips that are >30 days past their end date.
   * This is called on mount and can be triggered manually.
   * 
   * COST SAVINGS:
   * - Each archived trip saves $0.33 in storage costs
   * - 100K users with 2 old trips = $66K savings
   */
  const autoArchiveOldTrips = useCallback(async () => {
    if (!wallet) return;
    
    try {
      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program<Triper>(IDL as any, provider);
      
      // Get all user trips
      const trips = await getUserTrips(program, wallet.publicKey);
      
      // Delegate to trip-actions for auto-archiving logic
      const archivedPDAs = await autoArchiveOldTripsOnChain(program, provider, trips);
      
      if (archivedPDAs.length > 0) {
        console.log(`✅ Auto-archived ${archivedPDAs.length} old trips`);
        
        // Update local state for archived trips
        archivedPDAs.forEach((pda) => {
          updateTrip(pda.toString(), { isActive: false });
        });
      }
    } catch (err) {
      console.error('Failed to auto-archive trips:', err);
    }
  }, [wallet, connection, updateTrip]);

  const deleteTrip = useCallback(async (tripId: string) => {
    if (!wallet) {
      showWalletRequired();
      throw new Error('Wallet not connected');
    }
    
    const toastId = showLoading('Deleting trip...');
    setLoading(true);
    setError(null);
    
    try {
      // Note: Solana accounts can't be truly deleted
      // We just mark as inactive
      await updateTripData(tripId, false);
      removeTrip(tripId);
      updateToast(toastId, 'success', 'Trip deleted successfully!');
      console.log('✅ Trip deactivated:', tripId);
    } catch (err) {
      console.error('Failed to delete trip:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      updateToast(toastId, 'error', `Failed to delete trip: ${error.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, updateTripData, removeTrip]);

  // Auto-fetch trips on mount
  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  return {
    trips: myTrips,
    archivedTrips,
    loading,
    error,
    fetchTrips,
    fetchArchivedTrips,
    createTrip,
    updateTrip: updateTripData,
    deleteTrip,
    canUpdateTrip,
    archiveTrip,
    autoArchiveOldTrips,
  };
}
