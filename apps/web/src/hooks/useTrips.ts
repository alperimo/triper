import { useCallback, useEffect, useState } from 'react';
import { useTripStore } from '@/lib/store/trip';
import type { Trip } from '@/types';

export function useTrips() {
  const { myTrips, addTrip, updateTrip, removeTrip, setMyTrips } = useTripStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/trips');
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      
      const data: Trip[] = await response.json();
      setMyTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [setMyTrips]);

  const createTrip = useCallback(async (trip: Omit<Trip, 'id' | 'createdAt' | 'owner'>) => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trip),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create trip');
      }
      
      const newTrip: Trip = await response.json();
      addTrip(newTrip);
      return newTrip;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addTrip]);

  const updateTripData = useCallback(async (tripId: string, updates: Partial<Trip>) => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update trip');
      }
      
      const updatedTrip: Trip = await response.json();
      updateTrip(tripId, updatedTrip);
      return updatedTrip;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateTrip]);

  const deleteTrip = useCallback(async (tripId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete trip');
      }
      
      removeTrip(tripId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [removeTrip]);

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
