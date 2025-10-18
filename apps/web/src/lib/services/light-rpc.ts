/**
 * Light Protocol RPC Service
 * 
 * Centralized configuration for ZK Compression using Helius Light RPC.
 * Helius provides FREE Light RPC support on all plans.
 * 
 * ARCHITECTURE:
 * - Traditional accounts: Use standard Anchor program.account.trip.fetch()
 * - Compressed accounts: Use Rpc.getCompressedAccount()
 * - Smart fetch: Try traditional first, fallback to compressed
 * 
 * COST OPTIMIZATION:
 * - Hybrid approach: Create traditional → Archive to compressed after completion
 * - Traditional updates: $0.000005/update (almost free)
 * - Compressed storage: 80% cheaper than traditional
 * - Breakeven: 13 updates for Trip (we expect ~10 updates during planning)
 * 
 * @see https://docs.helius.dev/compression-and-das-api/compression-rpc-methods
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { Rpc, createRpc } from '@lightprotocol/stateless.js';

/**
 * Singleton Light RPC instance
 * Lazy-initialized on first access
 */
let lightRpcInstance: Rpc | null = null;

/**
 * Get or create the Light RPC instance
 * 
 * Uses Helius RPC endpoint with automatic Light RPC support.
 * Falls back to regular RPC if Light-specific endpoint not configured.
 * 
 * @returns Light RPC instance for compressed account operations
 */
export function getLightRpc(): Rpc {
  if (lightRpcInstance) {
    return lightRpcInstance;
  }

  // Use Helius RPC endpoint (FREE Light RPC support on all plans)
  const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
  
  if (!rpcUrl) {
    throw new Error('NEXT_PUBLIC_HELIUS_RPC_URL or NEXT_PUBLIC_RPC_URL must be configured');
  }

  // Create Light RPC instance
  // This automatically configures Light Protocol compression endpoints
  lightRpcInstance = createRpc(rpcUrl, rpcUrl);
  
  return lightRpcInstance;
}

/**
 * Get standard Solana connection (for traditional accounts)
 * 
 * @returns Standard Solana connection
 */
export function getConnection(): Connection {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  
  if (!rpcUrl) {
    throw new Error('NEXT_PUBLIC_RPC_URL must be configured');
  }

  return new Connection(rpcUrl, 'confirmed');
}

/**
 * Check if an account is compressed
 * 
 * This is an expensive operation (makes RPC calls to both traditional and compressed endpoints).
 * Only use when absolutely necessary (e.g., before update operations, archive status UI).
 * 
 * DON'T use this upfront for every fetch - use smart fetch instead!
 * 
 * @param accountPDA - Public key of the account to check
 * @returns true if account exists in compressed state, false if traditional or not found
 * 
 * @example
 * ```typescript
 * // ❌ DON'T: Check compression upfront for display
 * const isCompressed = await isAccountCompressed(tripPDA);
 * const trip = isCompressed ? await fetchCompressed() : await fetchTraditional();
 * 
 * // ✅ DO: Use smart fetch (lazy check)
 * const trip = await fetchTrip(tripPDA); // Tries traditional first, falls back automatically
 * 
 * // ✅ DO: Check only when needed
 * if (await isAccountCompressed(tripPDA)) {
 *   toast.error("Cannot edit archived trip");
 * }
 * ```
 */
export async function isAccountCompressed(accountPDA: PublicKey): Promise<boolean> {
  try {
    const lightRpc = getLightRpc();
    const compressedAccount = await lightRpc.getCompressedAccount(accountPDA);
    
    // If we get a result from compressed RPC, account is compressed
    return compressedAccount !== null && compressedAccount !== undefined;
  } catch (error) {
    // If compressed RPC fails, account is either traditional or doesn't exist
    return false;
  }
}

/**
 * Get compressed account data
 * 
 * Low-level function to fetch compressed account.
 * Prefer using smart fetch in your hooks (e.g., useTrips.fetchTrip).
 * 
 * @param accountPDA - Public key of the compressed account
 * @returns Compressed account data or null if not found
 */
export async function getCompressedAccount(accountPDA: PublicKey) {
  const lightRpc = getLightRpc();
  return lightRpc.getCompressedAccount(accountPDA);
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Smart Fetch Pattern** (Recommended):
 *    ```typescript
 *    export async function fetchTrip(tripPDA: PublicKey): Promise<Trip> {
 *      try {
 *        return await program.account.trip.fetch(tripPDA);
 *      } catch {
 *        return await lightRpc.getCompressedAccount(tripPDA);
 *      }
 *    }
 *    ```
 * 
 * 2. **Update Guard Pattern**:
 *    ```typescript
 *    export async function updateTrip(tripPDA: PublicKey, data: Partial<Trip>) {
 *      if (await isAccountCompressed(tripPDA)) {
 *        throw new Error("Cannot update archived trip");
 *      }
 *      // Proceed with update...
 *    }
 *    ```
 * 
 * 3. **Archive Pattern**:
 *    ```typescript
 *    export async function archiveTrip(tripPDA: PublicKey) {
 *      // One-way conversion: traditional → compressed
 *      // This is PERMANENT, cannot be reversed!
 *      await compressAccount(program, tripPDA);
 *    }
 *    ```
 * 
 * 4. **Time-Based Archiving**:
 *    ```typescript
 *    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
 *    if (trip.endDate < thirtyDaysAgo && !(await isAccountCompressed(tripPDA))) {
 *      // Auto-archive old trips for cost savings
 *      await archiveTrip(tripPDA);
 *    }
 *    ```
 */

export default {
  getLightRpc,
  getConnection,
  isAccountCompressed,
  getCompressedAccount,
};
