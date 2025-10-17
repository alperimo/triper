// API Route: /api/trips - CRUD operations for trips

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { getUserTrips } from '@/lib/solana/trip-actions';
import type { Triper } from '@/lib/anchor/types';
import triperIdl from '@/lib/anchor/triper.json';

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
    
    // Fetch from Solana blockchain
    const connection = new Connection(
      process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );
    const program = new Program<Triper>(triperIdl as Triper);
    
    const userPubKey = new PublicKey(userPublicKey);
    const trips = await getUserTrips(program, userPubKey);
    
    // Format for API response
    const formattedTrips = trips.map(trip => ({
      id: trip.address.toString(),
      userId: trip.data.owner.toString(),
      routeHash: Buffer.from(trip.data.routeHash).toString('hex'),
      createdAt: new Date(trip.data.createdAt.toNumber() * 1000).toISOString(),
      isActive: trip.data.isActive,
      computationCount: trip.data.computationCount,
    }));
    
    return NextResponse.json({ trips: formattedTrips });
  } catch (error) {
    console.error('Fetch trips error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}
