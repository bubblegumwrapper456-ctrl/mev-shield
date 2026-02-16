import { NextRequest, NextResponse } from 'next/server';
import { isValidSolanaAddress, getSOLPrice } from '@/lib/solana';
import { fetchWalletSwapsViaRPC } from '@/lib/solana-fetcher';
import { detectSandwiches, detectSandwichesMock } from '@/lib/sandwich-detector';
import { aggregateReport } from '@/lib/loss-calculator';
import { serializeReport } from '@/lib/report-serializer';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // requests per minute (lower for RPC)
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Use mock data if MOCK_DATA env is set, otherwise use real RPC
function shouldUseMockData(): boolean {
  return process.env.USE_MOCK_DATA === 'true';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { wallet: string } }
) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const { wallet } = params;

    // Validate wallet address
    if (!wallet || !isValidSolanaAddress(wallet)) {
      return NextResponse.json(
        { error: 'Invalid Solana wallet address' },
        { status: 400 }
      );
    }

    const solPrice = await getSOLPrice();

    let report;

    if (shouldUseMockData()) {
      // Mock data for development
      const mockAttacks = detectSandwichesMock(wallet);
      report = aggregateReport(wallet, mockAttacks, solPrice);
    } else {
      // Real data via Solana RPC (needed for proper pool address extraction)
      console.log(`[API] Starting sandwich analysis for ${wallet}`);
      const swaps = await fetchWalletSwapsViaRPC(wallet);
      console.log(`[API] Found ${swaps.length} DEX swaps`);
      console.log(`[API] Detecting sandwiches...`);
      const attacks = await detectSandwiches(wallet, swaps, solPrice);
      console.log(`[API] Detected ${attacks.length} sandwich attacks`);
      report = aggregateReport(wallet, attacks, solPrice);
    }

    const serialized = serializeReport(report);

    return NextResponse.json(serialized, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Sandwich check error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze wallet. Please try again.' },
      { status: 500 }
    );
  }
}
