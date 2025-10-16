/**
 * Routing Service - Privacy-aware route calculation
 * 
 * PRIVACY CONSIDERATIONS:
 * - By default, uses client-side straight-line routing (no data leaves the browser)
 * - Optional OSRM integration for realistic routes (requires self-hosted server)
 * - NEVER send routes to third-party services without user consent
 * 
 * Routing profiles:
 * - car: Fastest routes for driving (requires OSRM)
 * - foot: Walking routes (requires OSRM)
 * - bike: Bicycle routes (requires OSRM)
 * - straight: Direct line (client-side, most private)
 */

export type RoutingProfile = 'car' | 'foot' | 'bike' | 'straight';

// Privacy setting: Enable external routing only if explicitly configured
const ENABLE_EXTERNAL_ROUTING = process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_ROUTING === 'true';
const OSRM_SERVER_URL = process.env.NEXT_PUBLIC_OSRM_SERVER_URL || null; // Self-hosted OSRM server

export interface RouteCoordinate {
  lng: number;
  lat: number;
}

export interface RouteResult {
  coordinates: [number, number][]; // [lng, lat][]
  distance: number; // meters
  duration: number; // seconds
}

/**
 * Fetch route from OSRM API
 * 
 * ⚠️ PRIVACY WARNING: Only call this with a self-hosted OSRM server!
 * DO NOT use public OSRM servers for production (privacy violation)
 */
async function fetchOSRMRoute(
  waypoints: RouteCoordinate[],
  profile: 'car' | 'foot' | 'bike'
): Promise<RouteResult> {
  if (waypoints.length < 2) {
    throw new Error('Need at least 2 waypoints to create a route');
  }

  // Privacy check: Only allow if explicitly enabled with self-hosted server
  if (!ENABLE_EXTERNAL_ROUTING || !OSRM_SERVER_URL) {
    console.warn('⚠️ External routing disabled for privacy. Use straight line or configure self-hosted OSRM.');
    throw new Error('External routing not configured');
  }

  // Format coordinates as "lng,lat;lng,lat;..."
  const coordinates = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
  
  // Use self-hosted OSRM server (NOT public demo server!)
  const url = `${OSRM_SERVER_URL}/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    
    return {
      coordinates: route.geometry.coordinates as [number, number][],
      distance: route.distance,
      duration: route.duration,
    };
  } catch (error) {
    console.error('OSRM routing error:', error);
    throw error;
  }
}

/**
 * Create straight line route (no routing service needed)
 */
function createStraightRoute(waypoints: RouteCoordinate[]): RouteResult {
  const coordinates = waypoints.map(w => [w.lng, w.lat] as [number, number]);
  
  // Calculate approximate distance (haversine formula)
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const d = haversineDistance(
      waypoints[i].lat,
      waypoints[i].lng,
      waypoints[i + 1].lat,
      waypoints[i + 1].lng
    );
    totalDistance += d;
  }
  
  // Assume average speed of 50 km/h for straight line
  const duration = (totalDistance / 1000) * 72; // seconds
  
  return {
    coordinates,
    distance: totalDistance,
    duration,
  };
}

/**
 * Haversine distance formula (meters)
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get route between waypoints
 * 
 * Privacy-first approach:
 * - Always defaults to client-side straight line routing
 * - Only uses external routing if explicitly configured with self-hosted server
 * 
 * @param waypoints - Array of coordinates to route through
 * @param profile - Routing profile (car, foot, bike, straight)
 * @returns Route result with coordinates and metadata
 */
export async function getRoute(
  waypoints: RouteCoordinate[],
  profile: RoutingProfile = 'straight' // Default to most private option
): Promise<RouteResult> {
  if (waypoints.length < 2) {
    throw new Error('Need at least 2 waypoints');
  }

  // For straight line, use client-side calculation (most private)
  if (profile === 'straight') {
    return createStraightRoute(waypoints);
  }

  // For car/foot/bike, attempt external routing only if configured
  try {
    return await fetchOSRMRoute(waypoints, profile);
  } catch (error) {
    console.warn(`⚠️ ${profile} routing unavailable (privacy-safe fallback to straight line)`, error);
    // Always fallback to client-side straight line for privacy
    return createStraightRoute(waypoints);
  }
}

/**
 * Check if external routing is available
 */
export function isExternalRoutingAvailable(): boolean {
  return ENABLE_EXTERNAL_ROUTING && !!OSRM_SERVER_URL;
}

/**
 * Get available routing profiles based on configuration
 */
export function getAvailableProfiles(): RoutingProfile[] {
  const profiles: RoutingProfile[] = ['straight']; // Always available
  
  if (isExternalRoutingAvailable()) {
    profiles.push('car', 'foot', 'bike');
  }
  
  return profiles;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
