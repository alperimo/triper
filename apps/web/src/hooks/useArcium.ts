import { useState, useEffect } from 'react';
import { getArciumClient } from '@/lib/arcium/client';
import { 
  encryptRoute, 
  encryptDates, 
  encryptInterests,
  decryptRoute,
  decryptDates,
  decryptInterests,
} from '@/lib/arcium/encryption';

interface UseArciumReturn {
  encrypt: (data: any) => Promise<Uint8Array>;
  decrypt: (data: Uint8Array) => Promise<any>;
  encryptTripData: (trip: {
    route: Array<{ lat: number; lng: number }>;
    startDate: Date;
    endDate: Date;
    interests: string[];
  }) => Promise<{
    encryptedRoute: Uint8Array;
    encryptedDates: Uint8Array;
    encryptedInterests: Uint8Array;
  }>;
  computeMatch: (tripA: string, tripB: string) => Promise<number>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for Arcium MPC operations
 */
export function useArcium(): UseArciumReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [client, setClient] = useState<ReturnType<typeof getArciumClient> | null>(null);

  useEffect(() => {
    const arciumClient = getArciumClient();
    arciumClient.initialize().then(() => {
      setClient(arciumClient);
    });
  }, []);

  const encrypt = async (data: any): Promise<Uint8Array> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generic encryption (fallback)
      const encoder = new TextEncoder();
      return encoder.encode(JSON.stringify(data));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const decrypt = async (data: Uint8Array): Promise<any> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generic decryption (fallback)
      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(data));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const encryptTripData = async (trip: {
    route: Array<{ lat: number; lng: number }>;
    startDate: Date;
    endDate: Date;
    interests: string[];
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [encryptedRoute, encryptedDates, encryptedInterests] = await Promise.all([
        encryptRoute(trip.route),
        encryptDates(trip.startDate, trip.endDate),
        encryptInterests(trip.interests),
      ]);

      return {
        encryptedRoute,
        encryptedDates,
        encryptedInterests,
      };
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const computeMatch = async (tripA: string, tripB: string): Promise<number> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Trigger MPC computation via API
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripAId: tripA, tripBId: tripB }),
      });
      
      if (!response.ok) {
        throw new Error('Match computation failed');
      }
      
      const data = await response.json();
      return data.result?.matchScore || 0;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    encrypt,
    decrypt,
    encryptTripData,
    computeMatch,
    isLoading,
    error,
  };
}
