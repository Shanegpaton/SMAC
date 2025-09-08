import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('=== Checking Distribution ===');
    
    // Get distribution settings
    const distribution = await prisma.SMACCoinsDistribution.findFirst();
    console.log('Distribution settings:', distribution);

    if (!distribution?.isActive) {
      console.log('Distribution is not active');
      return NextResponse.json({
        message: 'Distribution is not active',
        isActive: false,
        nextDistribution: null
      });
    }

    // Compute next distribution window without performing any distribution here
    // NOTE: Admin page should not trigger distributions. Actual distribution should be handled by a scheduled job.
    const now = new Date();
    const lastDistributed = distribution.lastDistributed;
    const timeSinceLastDistribution = now.getTime() - lastDistributed.getTime();
    // Seven days in milliseconds
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    const enoughTimePassed = timeSinceLastDistribution >= oneWeek;
    const nextDistribution = enoughTimePassed
      ? now
      : new Date(lastDistributed.getTime() + oneWeek);

    return NextResponse.json({
      message: 'Checked distribution window only (no coins distributed)',
      isActive: true,
      enoughTimePassed,
      nextDistribution
    });
  } catch (error) {
    console.error('Error checking distribution:', error);
    return NextResponse.json(
      { error: 'Failed to check distribution' },
      { status: 500 }
    );
  }
} 