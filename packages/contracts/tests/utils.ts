import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { Triper } from "../target/types/triper";
import { getMXEPublicKey } from "@arcium-hq/client";
import type { Waypoint, InterestTag } from "../../../apps/web/src/types";

/**
 * Test helper to get MXE public key with retry logic
 */
export async function getMXEPublicKeyWithRetry(
  provider: AnchorProvider,
  programId: PublicKey,
  maxRetries: number = 5
): Promise<Uint8Array> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const mxePubkey = await getMXEPublicKey(provider, programId);
      if (mxePubkey) {
        return mxePubkey;
      }
    } catch (error: any) {
      console.log(`Retry ${i + 1}/${maxRetries} getting MXE pubkey:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error("Failed to get MXE public key after retries");
}

/**
 * Helper to create sample trip data for SF to LA route
 * Returns Waypoints and InterestTags
 */
export function createSampleTripData(startDateOffset: number = 0): {
  waypoints: Waypoint[];
  destination: Waypoint;
  startDate: Date;
  endDate: Date;
  interests: InterestTag[];
} {
  const now = new Date();
  const startDate = new Date(now.getTime() + startDateOffset * 1000);
  const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days later
  
  // SF to LA route with real coordinates
  const waypoints: Waypoint[] = [
    { lat: 37.7749, lng: -122.4194, name: "San Francisco" },
    { lat: 37.3382, lng: -121.8863, name: "San Jose" },
    { lat: 36.6002, lng: -121.8947, name: "Monterey" },
    { lat: 36.2705, lng: -121.8080, name: "Big Sur" },
    { lat: 34.4208, lng: -119.6982, name: "Santa Barbara" },
  ];
  
  const destination: Waypoint = { lat: 34.0522, lng: -118.2437, name: "Los Angeles" };
  
  // Interests: hiking, photography, food
  const interests: InterestTag[] = [0, 1, 2]; // HIKING, PHOTOGRAPHY, FOOD
  
  return {
    waypoints,
    destination,
    startDate,
    endDate,
    interests,
  };
}

/**
 * Helper to create slightly different trip data for testing matches
 */
export function createVariantTripData(startDateOffset: number = 1000): {
  waypoints: Waypoint[];
  destination: Waypoint;
  startDate: Date;
  endDate: Date;
  interests: InterestTag[];
} {
  const now = new Date();
  const startDate = new Date(now.getTime() + startDateOffset * 1000);
  const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  
  // Similar route but different path
  const waypoints: Waypoint[] = [
    { lat: 37.7749, lng: -122.4194, name: "San Francisco" },
    { lat: 37.3382, lng: -121.8863, name: "San Jose" },
    { lat: 36.7783, lng: -119.4179, name: "Fresno" }, // Different route
    { lat: 35.3733, lng: -119.0187, name: "Bakersfield" }, // Different route
    { lat: 34.4208, lng: -119.6982, name: "Santa Barbara" },
  ];
  
  const destination: Waypoint = { lat: 34.0522, lng: -118.2437, name: "Los Angeles" };
  
  // Interests: hiking, photography (no food)
  const interests: InterestTag[] = [0, 1]; // HIKING, PHOTOGRAPHY
  
  return {
    waypoints,
    destination,
    startDate,
    endDate,
    interests,
  };
}
