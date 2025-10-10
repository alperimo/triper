import { create } from 'zustand';
import type { Trip } from '@/types';

interface TripState {
  currentTrip: Trip | null;
  myTrips: Trip[];
  isCreating: boolean;
  
  // Actions
  setCurrentTrip: (trip: Trip | null) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (tripId: string, updates: Partial<Trip>) => void;
  removeTrip: (tripId: string) => void;
  setCreating: (creating: boolean) => void;
  setMyTrips: (trips: Trip[]) => void;
}

export const useTripStore = create<TripState>((set) => ({
  currentTrip: null,
  myTrips: [],
  isCreating: false,
  
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  
  addTrip: (trip) => set((state) => ({
    myTrips: [...state.myTrips, trip],
    currentTrip: trip,
  })),
  
  updateTrip: (tripId, updates) => set((state) => ({
    myTrips: state.myTrips.map(trip =>
      trip.id === tripId ? { ...trip, ...updates } : trip
    ),
    currentTrip: state.currentTrip?.id === tripId
      ? { ...state.currentTrip, ...updates }
      : state.currentTrip,
  })),
  
  removeTrip: (tripId) => set((state) => ({
    myTrips: state.myTrips.filter(trip => trip.id !== tripId),
    currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip,
  })),
  
  setCreating: (creating) => set({ isCreating: creating }),
  
  setMyTrips: (trips) => set({ myTrips: trips }),
}));
