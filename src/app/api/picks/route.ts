import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    console.log('Picks API: Starting request');
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Add a small delay to prevent overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Build where clause
    const where: any = {
      published: true,
    };
    
    // If userId is provided, filter by that user
    if (userId) {
      where.authorId = userId;
    }
    
    const picks = await prisma.sMACArticle.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
        votes: true,
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });

    // Calculate vote counts for each article
    const picksWithVotes = picks.map(article => {
      const upvotes = article.votes.filter(vote => vote.vote === 1).length;
      const downvotes = article.votes.filter(vote => vote.vote === -1).length;
      
      return {
        ...article,
        upvotes,
        downvotes,
        commentCount: article._count.comments,
        votes: undefined, // Remove the votes array from response
        _count: undefined, // Remove the _count from response
      };
    });

    console.log('Picks API: Found', picksWithVotes.length, 'picks');

    return NextResponse.json(picksWithVotes, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching picks:', error);
    
    // Check if it's a connection-related error
    if (error instanceof Error && (
      error.message.includes('prepared statement') ||
      error.message.includes('connection') ||
      error.message.includes('timeout')
    )) {
      console.log('Connection error detected, returning empty array');
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch picks', details: error instanceof Error ? error.message : 'Unknown error' },
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