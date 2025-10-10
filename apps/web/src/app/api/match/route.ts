// API Route: POST /api/match - Trigger MPC match computation

import { NextRequest, NextResponse } from 'next/server';
import { getArciumClient } from '@/lib/arcium/client';

export async function POST(request: NextRequest) {
  try {
    const { tripAId, tripBId } = await request.json();
    
    if (!tripAId || !tripBId) {
      return NextResponse.json(
        { error: 'Missing tripAId or tripBId' },
        { status: 400 }
      );
    }
    
    // Trigger MPC computation via Arcium
    const arciumClient = getArciumClient();
    const computationId = await arciumClient.requestMatchComputation(tripAId, tripBId);
    
    // Poll for result (in production, use webhooks)
    // For now, get result immediately
    const result = await arciumClient.getMatchResult(computationId);
    
    return NextResponse.json({
      success: true,
      computationId,
      result: {
        matchScore: result.matchScore,
        routeOverlap: result.routeOverlap,
        dateOverlap: result.dateOverlap,
        interestSimilarity: result.interestSimilarity,
      },
    });
  } catch (error) {
    console.error('Match computation error:', error);
    return NextResponse.json(
      { error: 'Failed to compute match' },
      { status: 500 }
    );
  }
}
