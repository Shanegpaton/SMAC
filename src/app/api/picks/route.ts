import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Picks API: Starting request');
    
    // Add connection timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 15000);
    });

    const picksPromise = prisma.sMACArticle.findMany({
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

    // Race between timeout and database query
    const picks = await Promise.race([picksPromise, timeoutPromise]) as any;

    console.log('Picks API: Found', picks.length, 'picks');

    return NextResponse.json(picks, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching picks:', error);
    
    // Check if it's a prepared statement conflict error
    if (error instanceof Error && error.message.includes('prepared statement') && error.message.includes('already exists')) {
      console.log('Detected prepared statement conflict, attempting to reconnect...');
      
      try {
        // Try to disconnect and reconnect
        await prisma.$disconnect();
        console.log('Disconnected from database');
        
        // Wait a moment before reconnecting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await prisma.$connect();
        console.log('Reconnected to database');
        
        // Retry the query once
        const retryPicks = await prisma.sMACArticle.findMany({
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
        
        console.log('Picks API: Retry successful, found', retryPicks.length, 'picks');
        
        return NextResponse.json(retryPicks, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        
        // If retry also fails, return empty array instead of error
        console.log('Returning empty array due to connection issues');
        return NextResponse.json([], {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      }
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