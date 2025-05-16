import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const picks = await prisma.sMACArticle.findMany({
      where: {
        published: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(picks);
  } catch (error) {
    console.error('Error fetching picks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch picks' },
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

    const { title, gameDate, homeTeam, awayTeam, pick, reasoning, imageUrl } = await request.json();

    if (!title || !gameDate || !homeTeam || !awayTeam || !pick || !reasoning) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Parse gameDate as a Date object
    const parsedGameDate = new Date(gameDate);

    // Create the pick
    const newPick = await prisma.sMACArticle.create({
      data: {
        title,
        gameDate: parsedGameDate,
        homeTeam,
        awayTeam,
        pick,
        reasoning,
        imageUrl: imageUrl || null,
        authorId: session.user.id,
        published: false, // Set to false by default
        publishRequest: true, // Request publication
      },
    });

    return NextResponse.json(newPick);
  } catch (error) {
    console.error('Detailed error creating pick:', error);
    return NextResponse.json(
      { error: 'Failed to create pick. Please try again.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 