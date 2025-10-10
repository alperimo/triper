// API Route: /api/trips - CRUD operations for trips

import { NextRequest, NextResponse } from 'next/server';
import { getArciumClient } from '@/lib/arcium/client';
import { encryptRoute, encryptDates, encryptInterests, hashRoute } from '@/lib/arcium/encryption';
import { getSolanaConnection, createTripTransaction } from '@/lib/solana/transactions';
import { PublicKey } from '@solana/web3.js';

// GET /api/trips - Fetch user's trips
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userPublicKey = searchParams.get('userPublicKey');
    
    if (!userPublicKey) {
      return NextResponse.json(
        { error: 'Missing userPublicKey' },
        { status: 400 }
      );
    }
    
    // TODO: Fetch from Solana blockchain
    // For now, return mock data
    const trips = [
      {
        id: 'trip_1',
        userId: userPublicKey,
        startDate: '2025-11-01',
        endDate: '2025-11-15',
        routeHash: 'abc123...',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
    
    return NextResponse.json({ trips });
  } catch (error) {
    console.error('Fetch trips error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

// POST /api/trips - Create a new trip
export async function POST(request: NextRequest) {
  try {
    const { userPublicKey, route, startDate, endDate, interests } = await request.json();
    
    if (!userPublicKey || !route || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Encrypt trip data
    const encryptedRoute = await encryptRoute(route);
    const encryptedDates = await encryptDates(new Date(startDate), new Date(endDate));
    const encryptedInterests = await encryptInterests(interests || []);
    
    // Generate route hash for blockchain storage
    const routeHash = await hashRoute(route);
    
    // Submit to Arcium
    const arciumClient = getArciumClient();
    const tripId = `trip_${Date.now()}`;
    
    const arciumTxId = await arciumClient.submitEncryptedTrip(
      tripId,
      encryptedRoute,
      encryptedDates,
      encryptedInterests
    );
    
    // Create on-chain record
    const connection = getSolanaConnection();
    const userPubKey = new PublicKey(userPublicKey);
    
    const transaction = await createTripTransaction(connection, {
      userPublicKey: userPubKey,
      tripId,
      encryptedRouteHash: routeHash,
      startDate: new Date(startDate).getTime(),
      endDate: new Date(endDate).getTime(),
    });
    
    // TODO: Sign and send transaction (requires wallet adapter)
    // For now, return trip data
    const trip = {
      id: tripId,
      userId: userPublicKey,
      startDate,
      endDate,
      routeHash,
      arciumTxId,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    return NextResponse.json({ 
      success: true,
      trip,
      transaction: transaction.serialize().toString('base64'), // Return for client signing
    });
  } catch (error) {
    console.error('Create trip error:', error);
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}

// PATCH /api/trips/[id] - Update a trip
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('id');
    const updates = await request.json();
    
    if (!tripId) {
      return NextResponse.json(
        { error: 'Missing trip ID' },
        { status: 400 }
      );
    }
    
    // TODO: Implement trip updates on blockchain
    console.log('Updating trip:', tripId, updates);
    
    return NextResponse.json({ 
      success: true,
      message: 'Trip updated',
    });
  } catch (error) {
    console.error('Update trip error:', error);
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[id] - Delete a trip
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('id');
    
    if (!tripId) {
      return NextResponse.json(
        { error: 'Missing trip ID' },
        { status: 400 }
      );
    }
    
    // TODO: Deactivate trip on blockchain
    console.log('Deleting trip:', tripId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Trip deleted',
    });
  } catch (error) {
    console.error('Delete trip error:', error);
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    );
  }
}
