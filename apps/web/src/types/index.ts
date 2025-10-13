// Core type definitions for Triper

/**
 * H3 cell representation
 * H3 cells are stored as strings (hex format) or bigint (numeric format)
 */
export type H3Index = string; // e.g., "872830828ffffff"

/**
 * Waypoint with lat/lng coordinates
 * Converted to H3 cells for privacy-preserving storage
 */
export interface Waypoint {
  lat: number;
  lng: number;
  name?: string; // Optional place name
}

/**
 * Interest tags (0-31)
 * Maps to bool[32] array in MPC circuit
 */
export enum InterestTag {
  HIKING = 0,
  PHOTOGRAPHY = 1,
  FOOD = 2,
  CULTURE = 3,
  BEACH = 4,
  NIGHTLIFE = 5,
  ADVENTURE = 6,
  RELAXATION = 7,
  SHOPPING = 8,
  WILDLIFE = 9,
  HISTORY = 10,
  ART = 11,
  MUSIC = 12,
  SPORTS = 13,
  SKIING = 14,
  DIVING = 15,
  SURFING = 16,
  CLIMBING = 17,
  CYCLING = 18,
  RUNNING = 19,
  YOGA = 20,
  MEDITATION = 21,
  COOKING = 22,
  WINE = 23,
  COFFEE = 24,
  LOCAL = 25,
  LUXURY = 26,
  BUDGET = 27,
  ECO = 28,
  FAMILY = 29,
  SOLO = 30,
  COUPLE = 31,
}

export interface Trip {
  id: string;
  owner: string; // Wallet public key
  
  // Route data (up to 20 waypoints)
  waypoints: Waypoint[];
  destination: Waypoint; // Final destination
  
  // Date range
  startDate: Date;
  endDate: Date;
  
  // Interest tags
  interests: InterestTag[];
  
  // Metadata
  travelStyle: TravelStyle;
  isActive: boolean;
  createdAt: Date;
  
  // On-chain data (encrypted)
  encryptedData?: Uint8Array; // Full TripData encrypted (209 bytes)
  destinationGridHash: string; // H3 cell at resolution 6 (for pre-filtering)
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
  routeOverlap: number; // Percentage of route overlap (0-100)
  proximityScore: number; // How close routes are
  proximity: string; // Human-readable proximity (e.g., "15-20km away")
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
