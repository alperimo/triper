/**
 * Off-chain pre-filtering service abstraction
 * 
 * Allows switching between:
 * 1. Local implementation (Next.js API routes) - default for development
 * 2. Remote implementation (Cloudflare Workers) - for production scalability
 * 
 * Architecture:
 * - Interface defines contract
 * - Multiple implementations (local, remote)
 * - Easy migration path (change single config line)
 */

import type { PublicKey } from '@solana/web3.js';

/**
 * Pre-filtering query parameters
 * Narrows down potential matches before expensive MPC computation
 */
export interface PrefilterQuery {
  /** H3 cell at resolution 6 for destination area (~36 km²) */
  destinationGridHash: string;
  
  /** Date range for trip overlap */
  startDate: Date;
  endDate: Date;
  
  /** Optional: Exclude trips from these owners */
  excludeOwners?: string[];
  
  /** Optional: Limit number of results */
  limit?: number;
}

/**
 * Trip candidate returned from pre-filtering
 * Contains only public data (non-sensitive)
 */
export interface TripCandidate {
  /** Trip account public key */
  tripId: string;
  
  /** Trip owner's wallet address */
  owner: string;
  
  /** Destination grid hash (public) */
  destinationGridHash: string;
  
  /** Date range (public for overlap checking) */
  startDate: Date;
  endDate: Date;
  
  /** Is trip active? */
  isActive: boolean;
  
  /** When the trip was created */
  createdAt: Date;
}

/**
 * Pre-filtering service interface
 * All implementations must conform to this
 */
export interface IPrefilterService {
  /**
   * Query for potential trip matches
   * Returns candidates that match destination and date criteria
   */
  queryTrips(query: PrefilterQuery): Promise<TripCandidate[]>;
  
  /**
   * Health check for the service
   */
  health(): Promise<{ status: 'ok' | 'error'; message?: string }>;
}

/**
 * Configuration for the pre-filter service
 */
export interface PrefilterConfig {
  /** Service type: 'local' for Next.js API, 'remote' for Cloudflare Worker */
  type: 'local' | 'remote';
  
  /** Remote endpoint URL (for 'remote' type) */
  remoteUrl?: string;
  
  /** RPC endpoint for querying Solana accounts */
  rpcEndpoint: string;
  
  /** Program ID for the Triper smart contract */
  programId: PublicKey;
}

/**
 * Local implementation using Next.js API routes
 * Queries Solana directly from the server
 */
export class LocalPrefilterService implements IPrefilterService {
  private config: PrefilterConfig;
  
  constructor(config: PrefilterConfig) {
    this.config = config;
  }
  
  async queryTrips(query: PrefilterQuery): Promise<TripCandidate[]> {
    // Call our Next.js API route
    const response = await fetch('/api/trips/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationGridHash: query.destinationGridHash,
        startDate: query.startDate.toISOString(),
        endDate: query.endDate.toISOString(),
        excludeOwners: query.excludeOwners || [],
        limit: query.limit || 50,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Pre-filter query failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Convert ISO date strings back to Date objects
    return data.candidates.map((c: any) => ({
      ...c,
      startDate: new Date(c.startDate),
      endDate: new Date(c.endDate),
      createdAt: new Date(c.createdAt),
    }));
  }
  
  async health(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        return { status: 'ok' };
      }
      return { status: 'error', message: 'API not responding' };
    } catch (error) {
      return { status: 'error', message: (error as Error).message };
    }
  }
}

/**
 * Remote implementation using Cloudflare Workers
 * Offloads querying to edge compute for better performance
 */
export class RemotePrefilterService implements IPrefilterService {
  private config: PrefilterConfig;
  
  constructor(config: PrefilterConfig) {
    this.config = config;
    
    if (!config.remoteUrl) {
      throw new Error('remoteUrl is required for RemotePrefilterService');
    }
  }
  
  async queryTrips(query: PrefilterQuery): Promise<TripCandidate[]> {
    const response = await fetch(`${this.config.remoteUrl}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationGridHash: query.destinationGridHash,
        startDate: query.startDate.toISOString(),
        endDate: query.endDate.toISOString(),
        excludeOwners: query.excludeOwners || [],
        limit: query.limit || 50,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Remote pre-filter query failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Convert ISO date strings back to Date objects
    return data.candidates.map((c: any) => ({
      ...c,
      startDate: new Date(c.startDate),
      endDate: new Date(c.endDate),
      createdAt: new Date(c.createdAt),
    }));
  }
  
  async health(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    try {
      const response = await fetch(`${this.config.remoteUrl}/health`);
      if (response.ok) {
        return { status: 'ok' };
      }
      return { status: 'error', message: 'Worker not responding' };
    } catch (error) {
      return { status: 'error', message: (error as Error).message };
    }
  }
}

/**
 * Factory function to create appropriate pre-filter service
 * Use this in your app to get the configured service
 */
export function createPrefilterService(config: PrefilterConfig): IPrefilterService {
  switch (config.type) {
    case 'local':
      return new LocalPrefilterService(config);
    case 'remote':
      return new RemotePrefilterService(config);
    default:
      throw new Error(`Unknown pre-filter service type: ${config.type}`);
  }
}

/**
 * Default configuration (use local service)
 * Override this in production to use Cloudflare Workers
 */
export function getDefaultPrefilterConfig(
  rpcEndpoint: string,
  programId: PublicKey
): PrefilterConfig {
  return {
    type: process.env.NEXT_PUBLIC_PREFILTER_TYPE as 'local' | 'remote' || 'local',
    remoteUrl: process.env.NEXT_PUBLIC_PREFILTER_URL,
    rpcEndpoint,
    programId,
  };
}
