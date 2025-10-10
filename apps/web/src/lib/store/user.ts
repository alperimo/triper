import { create } from 'zustand';
import type { User } from '@/types';

interface UserState {
  user: User | null;
  publicKey: string | null;
  isConnected: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setPublicKey: (publicKey: string) => void;
  setConnected: (connected: boolean) => void;
  disconnect: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  publicKey: null,
  isConnected: false,
  
  setUser: (user) => set({ user }),
  
  setPublicKey: (publicKey) => set({ publicKey, isConnected: true }),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  disconnect: () => set({
    user: null,
    publicKey: null,
    isConnected: false,
  }),
}));
