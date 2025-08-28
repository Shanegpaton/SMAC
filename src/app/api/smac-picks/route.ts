import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    console.log('SMAC Picks API: Starting request');
    
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.isAdmin;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    const year = searchParams.get('year');

    console.log('SMAC Picks API: Query params:', { week, year });

    // Build where clause
    const where: any = {};
    if (week && year) {
      where.weekNumber = parseInt(week);
      where.year = parseInt(year);
    } else if (year) {
      where.year = parseInt(year);
    }

    // Add connection timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 15000);
    });

    const picksPromise = prisma.sMACPick.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { weekNumber: 'desc' },
        { date: 'desc' }
      ],
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Race between timeout and database query
    const picks = await Promise.race([picksPromise, timeoutPromise]) as any;

    console.log('SMAC Picks API: Found', picks.length, 'picks');

    return NextResponse.json(picks, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching SMAC picks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMAC picks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can create SMAC picks' },
        { status: 401 }
      );
    }

    const { date, sport, game, bet, odds, smacCoins, weekNumber, year } = await request.json();

    if (!date || !sport || !game || !bet || !odds || !smacCoins || !weekNumber || !year) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const newPick = await prisma.sMACPick.create({
      data: {
        date: new Date(date),
        sport,
        game,
        bet,
        odds: parseFloat(odds),
        smacCoins: parseInt(smacCoins),
        weekNumber: parseInt(weekNumber),
        year: parseInt(year),
        authorId: session.user.id,
      },
    });

    return NextResponse.json(newPick);
  } catch (error) {
    console.error('Error creating SMAC pick:', error);
    return NextResponse.json(
      { error: 'Failed to create SMAC pick' },
      { status: 500 }
    );
  }
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
} 