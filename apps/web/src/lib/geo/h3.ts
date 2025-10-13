/**
 * H3 geospatial utilities for privacy-preserving location handling
 * 
 * Resolution levels:
 * - Level 7: ~5 km² per cell (waypoints) - privacy-preserving while useful
 * - Level 6: ~36 km² per cell (destinations) - for pre-filtering queries
 * 
 * H3 provides better spatial properties than simple grid:
 * - Uniform cell size (no latitude distortion)
 * - Hexagonal tessellation (better neighbor relationships)
 * - Hierarchical structure (easy coarse-graining)
 */

import { latLngToCell, cellToLatLng, gridDisk, cellToParent } from 'h3-js';
import type { H3Index, Waypoint } from '@/types';

// Resolution levels matching the MPC circuit
export const WAYPOINT_RESOLUTION = 7; // ~5 km² (~2.5 km edge length)
export const DESTINATION_RESOLUTION = 6; // ~36 km² (~7 km edge length)

// Maximum waypoints supported by MPC circuit
export const MAX_WAYPOINTS = 20;

/**
 * Convert lat/lng to H3 cell at waypoint resolution (level 7)
 * Used for route waypoints stored in encrypted TripData
 */
export function latLngToH3Cell(lat: number, lng: number): H3Index {
  return latLngToCell(lat, lng, WAYPOINT_RESOLUTION);
}

/**
 * Convert H3 cell back to lat/lng coordinates
 * Returns center point of the cell
 */
export function h3CellToLatLng(h3Index: H3Index): { lat: number; lng: number } {
  const [lat, lng] = cellToLatLng(h3Index);
  return { lat, lng };
}

/**
 * Convert H3 hex string to bigint (u64 for MPC circuit)
 * H3 cells are 64-bit integers stored as hex strings
 */
export function h3ToU64(h3Index: H3Index): bigint {
  // Remove '0x' prefix if present
  const hexString = h3Index.startsWith('0x') ? h3Index.slice(2) : h3Index;
  return BigInt('0x' + hexString);
}

/**
 * Convert bigint back to H3 hex string
 */
export function u64ToH3(value: bigint): H3Index {
  return '0x' + value.toString(16).padStart(15, '0');
}

/**
 * Convert array of waypoints to H3 cells
 * Removes duplicates and limits to MAX_WAYPOINTS
 */
export function waypointsToH3Cells(waypoints: Waypoint[]): H3Index[] {
  const cells = new Set<H3Index>();
  
  for (const waypoint of waypoints) {
    if (cells.size >= MAX_WAYPOINTS) break;
    const cell = latLngToH3Cell(waypoint.lat, waypoint.lng);
    cells.add(cell);
  }
  
  return Array.from(cells);
}

/**
 * Compute destination grid hash (level 6) for pre-filtering
 * Used as public index for finding potential matches
 */
export function computeDestinationHash(destination: Waypoint): string {
  const destCell = latLngToCell(
    destination.lat,
    destination.lng,
    DESTINATION_RESOLUTION
  );
  return destCell;
}

/**
 * Get parent cell at destination resolution
 * Useful for coarse-graining waypoint cells
 */
export function waypointToDestinationCell(h3Index: H3Index): H3Index {
  return cellToParent(h3Index, DESTINATION_RESOLUTION);
}

/**
 * Get neighboring cells (ring around a cell)
 * Useful for proximity queries
 * 
 * @param h3Index - Center cell
 * @param radius - Ring radius (1 = immediate neighbors, 2 = 2 cells away, etc.)
 */
export function getNeighboringCells(h3Index: H3Index, radius: number = 1): H3Index[] {
  try {
    return gridDisk(h3Index, radius);
  } catch (error) {
    console.error('Error getting neighboring cells:', error);
    return [h3Index]; // Return center cell on error
  }
}

/**
 * Calculate Jaccard similarity between two sets of H3 cells
 * Returns percentage 0-100
 * This matches the MPC circuit's route similarity algorithm
 */
export function calculateRouteSimilarity(cellsA: H3Index[], cellsB: H3Index[]): number {
  if (cellsA.length === 0 || cellsB.length === 0) return 0;
  
  const setA = new Set(cellsA);
  const setB = new Set(cellsB);
  
  // Calculate intersection
  let intersection = 0;
  setA.forEach(cell => {
    if (setB.has(cell)) intersection++;
  });
  
  // Calculate union
  const union = setA.size + setB.size - intersection;
  
  if (union === 0) return 0;
  
  // Jaccard index as percentage
  return Math.round((intersection / union) * 100);
}

/**
 * Estimate distance between two H3 cells (in km)
 * Uses approximate great circle distance between cell centers
 */
export function estimateCellDistance(cellA: H3Index, cellB: H3Index): number {
  const coordsA = h3CellToLatLng(cellA);
  const coordsB = h3CellToLatLng(cellB);
  
  return haversineDistance(
    coordsA.lat,
    coordsA.lng,
    coordsB.lat,
    coordsB.lng
  );
}

/**
 * Haversine distance formula (great circle distance)
 * Returns distance in kilometers
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validate H3 index format
 */
export function isValidH3Index(h3Index: string): boolean {
  try {
    // H3 indices are 15 hex characters (64-bit with mode bits)
    const hexString = h3Index.startsWith('0x') ? h3Index.slice(2) : h3Index;
    return hexString.length === 15 && /^[0-9a-fA-F]+$/.test(hexString);
  } catch {
    return false;
  }
}

/**
 * Get approximate cell area in km²
 */
export function getCellAreaKm2(resolution: number): number {
  // Approximate areas (from H3 documentation)
  const areas: Record<number, number> = {
    0: 4357449.416,
    1: 609788.441,
    2: 86801.780,
    3: 12392.264,
    4: 1770.323,
    5: 252.903,
    6: 36.129,
    7: 5.161,
    8: 0.737,
    9: 0.105,
    10: 0.015,
  };
  
  return areas[resolution] || 0;
}

/**
 * Format H3 cell for display
 * Shows first 8 and last 4 characters
 */
export function formatH3Index(h3Index: H3Index): string {
  if (h3Index.length < 13) return h3Index;
  return `${h3Index.slice(0, 8)}...${h3Index.slice(-4)}`;
}
