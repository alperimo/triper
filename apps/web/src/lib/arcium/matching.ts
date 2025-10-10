// MPC matching logic (runs in Arcium secure enclave)

import { calculateCellOverlap } from '@/lib/geo/grid';
import type { GridCell } from '@/types';

/**
 * Calculate route overlap score (0-100)
 * This computation happens in Arcium's MPC environment
 */
export function calculateRouteScore(
  routeA: GridCell[],
  routeB: GridCell[]
): number {
  const overlap = calculateCellOverlap(routeA, routeB);
  const maxLength = Math.max(routeA.length, routeB.length);
  
  if (maxLength === 0) return 0;
  
  return Math.round((overlap / maxLength) * 100);
}

/**
 * Calculate date overlap score (0-100)
 */
export function calculateDateScore(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): number {
  const overlapStart = new Date(Math.max(startA.getTime(), startB.getTime()));
  const overlapEnd = new Date(Math.min(endA.getTime(), endB.getTime()));
  
  if (overlapStart >= overlapEnd) {
    return 0; // No overlap
  }
  
  const overlapDays = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24);
  const totalDays = Math.max(
    (endA.getTime() - startA.getTime()) / (1000 * 60 * 60 * 24),
    (endB.getTime() - startB.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return Math.round((overlapDays / totalDays) * 100);
}

/**
 * Calculate interest similarity score (0-100)
 */
export function calculateInterestScore(
  interestsA: string[],
  interestsB: string[]
): number {
  const setA = new Set(interestsA);
  const setB = new Set(interestsB);
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  if (union.size === 0) return 0;
  
  // Jaccard similarity
  return Math.round((intersection.size / union.size) * 100);
}

/**
 * Compute overall match score
 * Weighted average: 40% route, 30% dates, 30% interests
 */
export function computeMatchScore(
  routeScore: number,
  dateScore: number,
  interestScore: number
): number {
  return Math.round(
    routeScore * 0.4 + dateScore * 0.3 + interestScore * 0.3
  );
}

/**
 * Full matching computation (MPC)
 * This would run inside Arcium's secure enclave
 */
export interface MatchInput {
  route: GridCell[];
  startDate: Date;
  endDate: Date;
  interests: string[];
}

export interface MatchOutput {
  matchScore: number;
  routeScore: number;
  dateScore: number;
  interestScore: number;
  routeOverlapCells: number;
  dateOverlapDays: number;
}

export function computeMatch(tripA: MatchInput, tripB: MatchInput): MatchOutput {
  const routeScore = calculateRouteScore(tripA.route, tripB.route);
  const dateScore = calculateDateScore(
    tripA.startDate,
    tripA.endDate,
    tripB.startDate,
    tripB.endDate
  );
  const interestScore = calculateInterestScore(tripA.interests, tripB.interests);
  const matchScore = computeMatchScore(routeScore, dateScore, interestScore);
  
  const routeOverlapCells = calculateCellOverlap(tripA.route, tripB.route);
  
  const overlapStart = new Date(Math.max(tripA.startDate.getTime(), tripB.startDate.getTime()));
  const overlapEnd = new Date(Math.min(tripA.endDate.getTime(), tripB.endDate.getTime()));
  const dateOverlapDays = overlapStart < overlapEnd
    ? Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  return {
    matchScore,
    routeScore,
    dateScore,
    interestScore,
    routeOverlapCells,
    dateOverlapDays,
  };
}
