// Core type definitions for Triper

export interface GridCell {
  lat: number;  // Grid cell center latitude
  lng: number;  // Grid cell center longitude
  cellId: string; // Unique identifier (e.g., "52.5_13.4")
}

export interface Trip {
  id: string;
  owner: string; // Wallet public key
  gridCells: GridCell[]; // Route represented as grid cells
  startDate: Date;
  endDate: Date;
  interests: string[]; // e.g., ["hiking", "photography", "food"]
  travelStyle: TravelStyle;
  isActive: boolean;
  createdAt: Date;
  
  // Encrypted data (stored on-chain)
  encryptedGridCells?: Uint8Array;
  encryptedDates?: Uint8Array;
  encryptedInterests?: Uint8Array;
}

export type TravelStyle = 
  | "backpacker"
  | "luxury"
  | "adventure"
  | "cultural"
  | "business"
  | "family";

export interface Match {
  id: string;
  tripAId: string;
  tripBId: string;
  matchScore: number; // 0-100
  proximityScore: number; // How close routes are
  dateOverlap: number; // Days of overlap
  interestSimilarity: number; // 0-1
  status: MatchStatus;
  createdAt: Date;
  
  // Revealed after mutual consent
  revealedToA: boolean;
  revealedToB: boolean;
}

export type MatchStatus = 
  | "pending"      // Computed but not viewed
  | "viewed"       // One user saw it
  | "interested"   // One user expressed interest
  | "mutual"       // Both interested
  | "revealed"     // Identities revealed
  | "expired";     // Trip dates passed

export interface User {
  publicKey: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  verified: boolean;
  memberSince: Date;
  
  // Privacy settings
  privacyLevel: PrivacyLevel;
}

export type PrivacyLevel = 
  | "maximum"  // Only show match score
  | "balanced" // Show score + general area
  | "open";    // Show more details

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface EncryptedAura {
  position: [number, number]; // [lng, lat] for map rendering
  matchScore: number;
  matchId: string;
  approximateDistance: number; // km
}
