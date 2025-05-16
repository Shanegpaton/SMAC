import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'You must be an admin to view SMAC picks' },
        { status: 401 }
      );
    }

    // If no picks exist, return empty array instead of error
    const picks = await prisma.sMACPick.findMany({
      orderBy: [
        { year: 'desc' },
        { weekNumber: 'desc' },
        { date: 'desc' }
      ],
    });

    // Always return a response, even if empty
    return NextResponse.json(picks || []);
  } catch (error) {
    console.error('Error in GET /api/admin/smac-picks:', error);
    // Return empty array instead of error for now
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'You must be an admin to create SMAC picks' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Received request body:', body);
    const { date, sport, game, bet, odds, smacCoins } = body;

    // Validate required fields
    if (!date || !sport || !game || !bet || !odds || !smacCoins) {
      console.log('Missing required fields:', {
        date: !date,
        sport: !sport,
        game: !game,
        bet: !bet,
        odds: !odds,
        smacCoins: !smacCoins
      });
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Calculate week number and year
    const pickDate = new Date(date);
    console.log('Parsed date:', pickDate);
    
    if (isNaN(pickDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const weekNumber = getWeekNumber(pickDate);
    const year = pickDate.getFullYear();

    // Validate numeric fields
    const parsedOdds = parseFloat(odds);
    const parsedSmacCoins = parseInt(smacCoins);

    if (isNaN(parsedOdds)) {
      return NextResponse.json(
        { error: 'Invalid odds value' },
        { status: 400 }
      );
    }

    if (isNaN(parsedSmacCoins)) {
      return NextResponse.json(
        { error: 'Invalid SMAC coins value' },
        { status: 400 }
      );
    }

    console.log('Creating pick with data:', {
      date: pickDate,
      sport,
      game,
      bet,
      odds: parsedOdds,
      smacCoins: parsedSmacCoins,
      weekNumber,
      year,
      authorId: session.user.id
    });

    // Create the pick
    const pick = await prisma.sMACPick.create({
      data: {
        date: pickDate,
        sport,
        game,
        bet,
        odds: parsedOdds,
        smacCoins: parsedSmacCoins,
        weekNumber,
        year,
        authorId: session.user.id,
      },
    });

    console.log('Successfully created pick:', pick);
    return NextResponse.json(pick);
  } catch (error) {
    console.error('Error creating SMAC pick:', error);
    // Return a more specific error message
    return NextResponse.json(
      { error: `Failed to create SMAC pick: ${error.message}` },
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