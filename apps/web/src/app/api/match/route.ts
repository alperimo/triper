// API Route: POST /api/match - Trigger MPC match computation
// NOTE: This should ideally be called client-side with wallet connected
// Server-side can only validate/prepare data

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { tripAId, tripBId } = await request.json();
    
    if (!tripAId || !tripBId) {
      return NextResponse.json(
        { error: 'Missing tripAId or tripBId' },
        { status: 400 }
      );
    }
    
    // NOTE: Actual MPC computation MUST happen client-side with wallet
    // because it requires signing transactions
    
    return NextResponse.json({
      message: 'Match computation must be triggered from client with wallet.',
      instructions: {
        step1: 'Retrieve encrypted trip data from local storage',
        step2: 'Call computeTripMatch() from @/lib/arcium/compute-match',
        step3: 'Listen for MatchComputedEvent using @/lib/arcium/events',
        step4: 'Display match scores to user',
      },
      example: {
        import: "import { computeTripMatch } from '@/lib/arcium/compute-match'",
        usage: "const { computationOffset } = await computeTripMatch(program, provider, tripDataA, tripDataB)",
      },
    });
  } catch (error) {
    console.error('Match validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate match request' },
      { status: 500 }
    );
  }
}
