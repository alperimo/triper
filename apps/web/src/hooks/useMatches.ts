import { useCallback, useEffect, useState } from 'react';
import { useMatchStore } from '@/lib/store/match';
import type { Match } from '@/types';

export function useMatches() {
  const { matches, setMatches } = useMatchStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/matches');
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      
      const data: Match[] = await response.json();
      setMatches(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [setMatches]);

  const acceptMatch = useCallback(async (matchId: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/accept`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to accept match');
      }
      
      // Refresh matches
      await fetchMatches();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  }, [fetchMatches]);

  const rejectMatch = useCallback(async (matchId: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/reject`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject match');
      }
      
      // Refresh matches
      await fetchMatches();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  }, [fetchMatches]);

  // Auto-fetch matches on mount
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return {
    matches,
    loading,
    error,
    fetchMatches,
    acceptMatch,
    rejectMatch,
  };
}
