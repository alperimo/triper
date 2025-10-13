import { useCallback, useEffect, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { useTripStore } from '@/lib/store/trip';
import { createTrip as createTripOnChain } from '@/lib/solana/create-trip';
import type { Trip, Waypoint, InterestTag } from '@/types';
import IDL from '@/lib/anchor/triper.json';
import type { Triper } from '@/lib/anchor/types';

// TODO: Move to env config
const PROGRAM_ID = new PublicKey(IDL.address);

export function useTrips() {
  const { myTrips, addTrip, updateTrip, removeTrip, setMyTrips } = useTripStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const fetchTrips = useCallback(async () => {
    if (!wallet) {
      console.warn('Wallet not connected, cannot fetch trips');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program<Triper>(IDL as any, provider);
      
      // Fetch all trip accounts owned by user
      const trips = await program.account.trip.all([
        {
          memcmp: {
            offset: 8, // Discriminator
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ]);
      
      // Convert to Trip format
      // Note: Waypoints/interests are encrypted in trip.account.encryptedData
      // We need to store metadata locally or decrypt client-side
      const formattedTrips: Trip[] = trips.map((trip: any) => ({
        id: trip.publicKey.toString(),
        owner: trip.account.owner.toString(),
        // Encrypted fields - need local storage or decryption
        waypoints: [], // TODO: Decrypt or load from local cache
        destination: { lat: 0, lng: 0 }, // TODO: Decrypt or load from local cache
        startDate: new Date(trip.account.startDate * 1000),
        endDate: new Date(trip.account.endDate * 1000),
        interests: [], // TODO: Decrypt or load from local cache
        travelStyle: 'adventure', // TODO: Store in local metadata
        isActive: trip.account.isActive,
        createdAt: new Date(trip.account.createdAt * 1000),
        destinationGridHash: Buffer.from(trip.account.destinationGridHash).toString('hex'),
        encryptedData: trip.account.encryptedData,
      }));
      
      setMyTrips(formattedTrips);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [wallet, connection, setMyTrips]);

  const createTrip = useCallback(async (
    waypoints: Waypoint[],
    destination: Waypoint,
    startDate: Date,
    endDate: Date,
    interests: InterestTag[],
    travelStyle: Trip['travelStyle'] = 'adventure'
  ) => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }
    
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
      return newTrip;
    } catch (err) {
      console.error('Failed to create trip:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, connection, addTrip]);

  const updateTripData = useCallback(async (tripId: string, isActive: boolean) => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program<Triper>(IDL as any, provider);
      
      // Update trip on-chain (currently only isActive is updatable)
      const tripPubkey = new PublicKey(tripId);
      
      await (program.methods as any)
        .updateTrip(isActive)
        .accounts({
          trip: tripPubkey,
          owner: wallet.publicKey,
        })
        .rpc();
      
      updateTrip(tripId, { isActive });
      console.log('✅ Trip updated:', tripId);
    } catch (err) {
      console.error('Failed to update trip:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, connection, updateTrip]);

  const deleteTrip = useCallback(async (tripId: string) => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Note: Solana accounts can't be truly deleted
      // We just mark as inactive
      await updateTripData(tripId, false);
      removeTrip(tripId);
      console.log('✅ Trip deactivated:', tripId);
    } catch (err) {
      console.error('Failed to delete trip:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
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
    loading,
    error,
    fetchTrips,
    createTrip,
    updateTrip: updateTripData,
    deleteTrip,
  };
}
