/**
 * Next.js API route for pre-filtering trip candidates
 * 
 * Queries Solana accounts by:
 * 1. destination_grid_hash (H3 level 6 cell)
 * 2. Date range overlap
 * 3. Active status
 * 
 * This dramatically reduces the number of expensive MPC computations needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';

/**
 * POST /api/trips/query
 * Query for trip candidates matching destination and dates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      destinationGridHash,
      startDate,
      endDate,
      excludeOwners = [],
      limit = 50,
    } = body;
    
    // Validate inputs
    if (!destinationGridHash || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: destinationGridHash, startDate, endDate' },
        { status: 400 }
      );
    }
    
    // Parse dates
    const queryStart = new Date(startDate);
    const queryEnd = new Date(endDate);
    
    if (isNaN(queryStart.getTime()) || isNaN(queryEnd.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    // Connect to Solana
    const rpcEndpoint = process.env.SOLANA_RPC_ENDPOINT || 'http://localhost:8899';
    const connection = new Connection(rpcEndpoint, 'confirmed');
    
    // Get program ID from environment
    const programId = new PublicKey(
      process.env.NEXT_PUBLIC_PROGRAM_ID || 'YOUR_PROGRAM_ID_HERE'
    );
    
    // Query all Trip accounts
    // Note: In production, you'd want to:
    // 1. Use getProgramAccounts with filters (destination_grid_hash)
    // 2. Cache results in Redis/database
    // 3. Use indexed queries for better performance
    
    const accounts = await connection.getProgramAccounts(programId, {
      filters: [
        {
          // Filter by account discriminator (first 8 bytes)
          // This identifies Trip accounts vs other account types
          memcmp: {
            offset: 0,
            bytes: '', // You'll need to add the actual discriminator
          },
        },
      ],
    });
    
    // Parse and filter accounts
    const candidates: any[] = [];
    
    for (const { pubkey, account } of accounts) {
      try {
        // Deserialize account data
        // You'll need to implement this based on your Trip account structure
        const tripData = deserializeTripAccount(account.data);
        
        // Filter by destination grid hash
        if (tripData.destinationGridHash !== destinationGridHash) {
          continue;
        }
        
        // Filter by active status
        if (!tripData.isActive) {
          continue;
        }
        
        // Filter by owner exclusions
        if (excludeOwners.includes(tripData.owner.toString())) {
          continue;
        }
        
        // Filter by date overlap
        const tripStart = new Date(tripData.startDate * 1000); // Convert Unix timestamp
        const tripEnd = new Date(tripData.endDate * 1000);
        
        const hasDateOverlap =
          (queryStart <= tripEnd && queryEnd >= tripStart) ||
          (tripStart <= queryEnd && tripEnd >= queryStart);
        
        if (!hasDateOverlap) {
          continue;
        }
        
        // Add to candidates
        candidates.push({
          tripId: pubkey.toString(),
          owner: tripData.owner.toString(),
          destinationGridHash: tripData.destinationGridHash,
          startDate: tripStart.toISOString(),
          endDate: tripEnd.toISOString(),
          isActive: tripData.isActive,
          createdAt: new Date(tripData.createdAt * 1000).toISOString(),
        });
        
        // Stop if we've reached the limit
        if (candidates.length >= limit) {
          break;
        }
      } catch (error) {
        console.error('Error parsing trip account:', error);
        continue;
      }
    }
    
    return NextResponse.json({
      candidates,
      count: candidates.length,
      query: {
        destinationGridHash,
        startDate: queryStart.toISOString(),
        endDate: queryEnd.toISOString(),
      },
    });
  } catch (error) {
    console.error('Pre-filter query error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Deserialize Trip account data
 * 
 * Trip account structure (from Solana program):
 * pub struct Trip {
 *     pub owner: Pubkey,                    // 32 bytes
 *     pub destination_grid_hash: String,    // 4 + N bytes
 *     pub start_date: i64,                  // 8 bytes
 *     pub end_date: i64,                    // 8 bytes
 *     pub encrypted_data: Vec<u8>,          // 4 + N bytes
 *     pub is_active: bool,                  // 1 byte
 *     pub created_at: i64,                  // 8 bytes
 * }
 */
function deserializeTripAccount(data: Buffer): any {
  // Skip account discriminator (first 8 bytes from Anchor)
  let offset = 8;
  
  // Owner (32 bytes)
  const owner = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;
  
  // destination_grid_hash (String: 4-byte length + data)
  const gridHashLength = data.readUInt32LE(offset);
  offset += 4;
  const destinationGridHash = data.slice(offset, offset + gridHashLength).toString('utf8');
  offset += gridHashLength;
  
  // start_date (i64 - 8 bytes)
  const startDate = data.readBigInt64LE(offset);
  offset += 8;
  
  // end_date (i64 - 8 bytes)
  const endDate = data.readBigInt64LE(offset);
  offset += 8;
  
  // encrypted_data (Vec<u8>: 4-byte length + data) - skip for pre-filtering
  const encryptedDataLength = data.readUInt32LE(offset);
  offset += 4 + encryptedDataLength;
  
  // is_active (bool - 1 byte)
  const isActive = data.readUInt8(offset) === 1;
  offset += 1;
  
  // created_at (i64 - 8 bytes)
  const createdAt = data.readBigInt64LE(offset);
  
  return {
    owner,
    destinationGridHash,
    startDate: Number(startDate),
    endDate: Number(endDate),
    isActive,
    createdAt: Number(createdAt),
  };
}

/**
 * GET /api/trips/query
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/trips/query',
    method: 'POST',
    description: 'Pre-filter trip candidates by destination and dates',
    parameters: {
      destinationGridHash: 'string (required) - H3 cell at resolution 6',
      startDate: 'ISO 8601 date string (required)',
      endDate: 'ISO 8601 date string (required)',
      excludeOwners: 'string[] (optional) - Wallet addresses to exclude',
      limit: 'number (optional, default: 50) - Max results',
    },
    example: {
      destinationGridHash: '862830807ffffff',
      startDate: '2025-06-01T00:00:00Z',
      endDate: '2025-06-15T00:00:00Z',
      excludeOwners: [],
      limit: 50,
    },
  });
}
