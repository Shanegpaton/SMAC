import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const articles = await prisma.sMACArticle.findMany({
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

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to create articles' },
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

    // Create the article
    const article = await prisma.sMACArticle.create({
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

    return NextResponse.json(article);
  } catch (error) {
    console.error('Detailed error creating article:', error);
    return NextResponse.json(
      { error: 'Failed to create article. Please try again.' },
      { status: 500 }
    );
  }
} 