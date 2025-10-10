import { create } from 'zustand';
import type { Match, EncryptedAura } from '@/types';

interface MatchState {
  matches: Match[];
  encryptedAuras: EncryptedAura[];
  selectedMatch: Match | null;
  isLoading: boolean;
  
  // Actions
  setMatches: (matches: Match[]) => void;
  addMatch: (match: Match) => void;
  updateMatch: (matchId: string, updates: Partial<Match>) => void;
  setEncryptedAuras: (auras: EncryptedAura[]) => void;
  setSelectedMatch: (match: Match | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],
  encryptedAuras: [],
  selectedMatch: null,
  isLoading: false,
  
  setMatches: (matches) => set({ matches }),
  
  addMatch: (match) => set((state) => ({
    matches: [...state.matches, match],
  })),
  
  updateMatch: (matchId, updates) => set((state) => ({
    matches: state.matches.map(match =>
      match.id === matchId ? { ...match, ...updates } : match
    ),
    selectedMatch: state.selectedMatch?.id === matchId
      ? { ...state.selectedMatch, ...updates }
      : state.selectedMatch,
  })),
  
  setEncryptedAuras: (auras) => set({ encryptedAuras: auras }),
  
  setSelectedMatch: (match) => set({ selectedMatch: match }),
  
  setLoading: (loading) => set({ isLoading: loading }),
}));
