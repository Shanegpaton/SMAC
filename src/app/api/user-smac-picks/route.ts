import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to view your picks' },
        { status: 401 }
      );
    }

    const picks = await prisma.userSMACPick.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: 'desc',
      },
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

    const { date, sport, game, bet, odds, smacCoins } = await request.json();

    if (!date || !sport || !game || !bet || !odds || !smacCoins) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const newPick = await prisma.userSMACPick.create({
      data: {
        date: new Date(date),
        sport,
        game,
        bet,
        odds: parseFloat(odds),
        smacCoins: parseFloat(smacCoins),
        userId: session.user.id,
      },
    });

    return NextResponse.json(newPick);
  } catch (error) {
    console.error('Error creating user SMAC pick:', error);
    return NextResponse.json(
      { error: 'Failed to create pick' },
      { status: 500 }
    );
  }
} 