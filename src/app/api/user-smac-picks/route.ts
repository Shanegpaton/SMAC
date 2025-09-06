import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    const year = searchParams.get('year');
    const userId = searchParams.get('userId');

    // If userId is provided, allow viewing other users' picks (for trader profiles)
    // Otherwise, require authentication for own picks
    if (!userId && !session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to view your picks' },
        { status: 401 }
      );
    }

    const targetUserId = userId || session?.user?.id;

    // Build where clause
    const where: any = {
      userId: targetUserId
    };
    if (week && year) {
      where.weekNumber = parseInt(week);
      where.year = parseInt(year);
    } else if (year) {
      where.year = parseInt(year);
    }

    const picks = await prisma.userSMACPick.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { weekNumber: 'desc' },
        { date: 'desc' }
      ],
    });

    return NextResponse.json(picks);
  } catch (error) {
    console.error('Error fetching user SMAC picks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch your picks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to create picks' },
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

    // Validate date
    const pickDate = new Date(date);
    if (isNaN(pickDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Calculate week number and year
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

    if (isNaN(parsedSmacCoins) || parsedSmacCoins <= 0) {
      return NextResponse.json(
        { error: 'SMAC coins must be a positive number' },
        { status: 400 }
      );
    }

    // Check if user has enough SMAC coins
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { smacCoins: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.smacCoins < parsedSmacCoins) {
      return NextResponse.json(
        { error: 'Not enough SMAC coins' },
        { status: 400 }
      );
    }

    // Create the pick and update user's SMAC coins in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the pick
      const newPick = await tx.userSMACPick.create({
        data: {
          date: pickDate,
          sport,
          game,
          bet,
          odds: parsedOdds,
          smacCoins: parsedSmacCoins,
          weekNumber,
          year,
          userId: session.user.id,
        },
      });

      // Update user's SMAC coins
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          smacCoins: {
            decrement: parsedSmacCoins
          }
        },
        select: {
          smacCoins: true
        }
      });

      return { pick: newPick, user: updatedUser };
    });

    console.log('Successfully created pick:', result);
    return NextResponse.json(result.pick);
  } catch (error) {
    console.error('Detailed error creating user SMAC pick:', error);
    return NextResponse.json(
      { error: `Failed to create pick: ${error.message}` },
      { status: 500 }
    );
  }
} 