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

// Helper function to get or create SMAC coins record
async function getOrCreateSMACCoins() {
  let smacCoins = await prisma.globalSMACCoins.findFirst();
  if (!smacCoins) {
    smacCoins = await prisma.globalSMACCoins.create({
      data: {
        balance: 1000, // Default starting balance
      },
    });
  }
  return smacCoins;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received request body:', body);
    const { date, sport, game, bet, odds, smacCoins, weekNumber, year } = body;

    // Validate required fields
    if (!date || !sport || !game || !bet || !odds || !smacCoins || !weekNumber || !year) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Get the global SMAC coins balance
    const globalSMACCoins = await getOrCreateSMACCoins();

    // Check if there are enough SMAC coins
    if (globalSMACCoins.balance < smacCoins) {
      return NextResponse.json(
        { error: 'Not enough SMAC coins' },
        { status: 400 }
      );
    }

    // Create the pick and update SMAC coins in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the pick
      const newPick = await tx.sMACPick.create({
        data: {
          date: new Date(date),
          sport,
          game,
          bet,
          odds,
          smacCoins,
          weekNumber,
          year,
          authorId: user.id,
        },
      });

      // Update global SMAC coins
      await tx.globalSMACCoins.update({
        where: { id: globalSMACCoins.id },
        data: {
          balance: {
            decrement: smacCoins,
          },
        },
      });

      return newPick;
    });

    console.log('Successfully created pick:', result);
    return NextResponse.json(result);
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