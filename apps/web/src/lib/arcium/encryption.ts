// Client-side encryption utilities for Arcium

import { latLngToCell, routeToCells } from '@/lib/geo/grid';
import type { GridCell } from '@/types';

/**
 * Encrypt route data (grid cells)
 */
export async function encryptRoute(
  route: Array<{ lat: number; lng: number }>
): Promise<Uint8Array> {
  // Convert exact coordinates to grid cells
  const gridCells = routeToCells(route);
  
  // Serialize grid cell IDs
  const cellIds = gridCells.map(cell => cell.cellId).join(',');
  
  // TODO: Replace with actual Arcium encryption
  // For now, just encode to Uint8Array
  const encoder = new TextEncoder();
  return encoder.encode(cellIds);
}

/**
 * Encrypt date range
 */
export async function encryptDates(
  startDate: Date,
  endDate: Date
): Promise<Uint8Array> {
  const dateData = {
    start: startDate.getTime(),
    end: endDate.getTime(),
  };
  
  // TODO: Replace with actual Arcium encryption
  const encoder = new TextEncoder();
  return encoder.encode(JSON.stringify(dateData));
}

/**
 * Encrypt interests/travel style
 */
export async function encryptInterests(
  interests: string[]
): Promise<Uint8Array> {
  const interestData = interests.join(',');
  
  // TODO: Replace with actual Arcium encryption
  const encoder = new TextEncoder();
  return encoder.encode(interestData);
}

/**
 * Decrypt route data
 */
export async function decryptRoute(
  encryptedData: Uint8Array
): Promise<GridCell[]> {
  // TODO: Replace with actual Arcium decryption
  const decoder = new TextDecoder();
  const cellIds = decoder.decode(encryptedData);
  
  return cellIds.split(',').map(cellId => {
    const [latStr, lngStr] = cellId.split('_');
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    return { lat, lng, cellId };
  });
}

/**
 * Decrypt dates
 */
export async function decryptDates(
  encryptedData: Uint8Array
): Promise<{ start: Date; end: Date }> {
  // TODO: Replace with actual Arcium decryption
  const decoder = new TextDecoder();
  const jsonData = decoder.decode(encryptedData);
  const { start, end } = JSON.parse(jsonData);
  
  return {
    start: new Date(start),
    end: new Date(end),
  };
}

/**
 * Decrypt interests
 */
export async function decryptInterests(
  encryptedData: Uint8Array
): Promise<string[]> {
  // TODO: Replace with actual Arcium decryption
  const decoder = new TextDecoder();
  const interestData = decoder.decode(encryptedData);
  
  return interestData.split(',');
}

/**
 * Generate a hash of route for verification (without revealing route)
 */
export async function hashRoute(
  route: Array<{ lat: number; lng: number }>
): Promise<string> {
  const routeString = JSON.stringify(route);
  const encoder = new TextEncoder();
  const data = encoder.encode(routeString);
  
  // Use Web Crypto API for hashing
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}
