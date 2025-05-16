import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.isAdmin;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    const year = searchParams.get('year');

    // Build where clause
    const where: any = { published: true };
    if (week && year) {
      where.weekNumber = parseInt(week);
      where.year = parseInt(year);
    }

    const picks = await prisma.sMACPick.findMany({
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

    return NextResponse.json(picks);
  } catch (error) {
    console.error('Error fetching SMAC picks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMAC picks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to create a pick' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { date, sport, game, bet, odds, smacCoins } = body;

    // Calculate week number and year
    const pickDate = new Date(date);
    const weekNumber = getWeekNumber(pickDate);
    const year = pickDate.getFullYear();

    const pick = await prisma.sMACPick.create({
      data: {
        date: pickDate,
        sport,
        game,
        bet,
        odds: parseFloat(odds),
        smacCoins: parseInt(smacCoins),
        weekNumber,
        year,
        authorId: session.user.id,
      },
    });

    return NextResponse.json(pick);
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