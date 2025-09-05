import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to view your articles' },
        { status: 401 }
      );
    }

    const articles = await prisma.sMACArticle.findMany({
      where: {
        authorId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching user articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch your articles' },
      { status: 500 }
    );
  }
} 