/**
 * Grid-based location system for privacy-preserving matching
 * Divides the world into cells of ~10km x 10km
 */

import type { GridCell } from '@/types';

// Grid size in degrees (~10km at equator, ~11.1km)
export const GRID_SIZE = 0.1;

/**
 * Convert lat/lng to grid cell
 * This provides spatial obfuscation for privacy
 */
export function latLngToCell(lat: number, lng: number): GridCell {
  // Floor to grid boundaries
  const cellLat = Math.floor(lat / GRID_SIZE) * GRID_SIZE;
  const cellLng = Math.floor(lng / GRID_SIZE) * GRID_SIZE;
  
  return {
    lat: cellLat + GRID_SIZE / 2, // Center of cell
    lng: cellLng + GRID_SIZE / 2,
    cellId: `${cellLat.toFixed(1)}_${cellLng.toFixed(1)}`,
  };
}

/**
 * Get adjacent cells (for proximity matching)
 * Returns 8 surrounding cells
 */
export function getAdjacentCells(cell: GridCell): GridCell[] {
  const adjacent: GridCell[] = [];
  
  for (let dLat = -1; dLat <= 1; dLat++) {
    for (let dLng = -1; dLng <= 1; dLng++) {
      if (dLat === 0 && dLng === 0) continue; // Skip center cell
      
      const newLat = cell.lat + dLat * GRID_SIZE;
      const newLng = cell.lng + dLng * GRID_SIZE;
      
      adjacent.push({
        lat: newLat,
        lng: newLng,
        cellId: `${(newLat - GRID_SIZE / 2).toFixed(1)}_${(newLng - GRID_SIZE / 2).toFixed(1)}`,
      });
    }
  }
  
  return adjacent;
}

/**
 * Convert route (array of lat/lng) to grid cells
 * Removes duplicates automatically
 */
export function routeToCells(route: Array<{lat: number; lng: number}>): GridCell[] {
  const cells = new Map<string, GridCell>();
  
  route.forEach(point => {
    const cell = latLngToCell(point.lat, point.lng);
    cells.set(cell.cellId, cell);
  });
  
  return Array.from(cells.values());
}

/**
 * Calculate cell overlap between two routes
 * Returns number of matching cells
 */
export function calculateCellOverlap(
  cellsA: GridCell[],
  cellsB: GridCell[]
): number {
  const cellIdsA = new Set(cellsA.map(c => c.cellId));
  const cellIdsB = new Set(cellsB.map(c => c.cellId));
  
  let overlap = 0;
  cellIdsA.forEach(id => {
    if (cellIdsB.has(id)) overlap++;
  });
  
  return overlap;
}

/**
 * Check if two cells are adjacent (within 1 grid cell)
 */
export function areCellsAdjacent(cellA: GridCell, cellB: GridCell): boolean {
  const latDiff = Math.abs(cellA.lat - cellB.lat);
  const lngDiff = Math.abs(cellA.lng - cellB.lng);
  
  return latDiff <= GRID_SIZE * 1.5 && lngDiff <= GRID_SIZE * 1.5;
}

/**
 * Get all cells within a radius (in grid cells)
 */
export function getCellsInRadius(center: GridCell, radius: number): GridCell[] {
  const cells: GridCell[] = [];
  
  for (let dLat = -radius; dLat <= radius; dLat++) {
    for (let dLng = -radius; dLng <= radius; dLng++) {
      const newLat = center.lat + dLat * GRID_SIZE;
      const newLng = center.lng + dLng * GRID_SIZE;
      
      cells.push({
        lat: newLat,
        lng: newLng,
        cellId: `${(newLat - GRID_SIZE / 2).toFixed(1)}_${(newLng - GRID_SIZE / 2).toFixed(1)}`,
      });
    }
  }
  
  return cells;
}

/**
 * Encode cells into a compact format for encryption
 */
export function encodeCells(cells: GridCell[]): Uint8Array {
  // Simple encoding: each cell as lat,lng pairs
  const buffer = new Float32Array(cells.length * 2);
  
  cells.forEach((cell, i) => {
    buffer[i * 2] = cell.lat;
    buffer[i * 2 + 1] = cell.lng;
  });
  
  return new Uint8Array(buffer.buffer);
}

/**
 * Decode cells from encrypted format
 */
export function decodeCells(data: Uint8Array): GridCell[] {
  const buffer = new Float32Array(data.buffer);
  const cells: GridCell[] = [];
  
  for (let i = 0; i < buffer.length; i += 2) {
    const lat = buffer[i];
    const lng = buffer[i + 1];
    
    cells.push({
      lat,
      lng,
      cellId: `${(lat - GRID_SIZE / 2).toFixed(1)}_${(lng - GRID_SIZE / 2).toFixed(1)}`,
    });
  }
  
  return cells;
}
