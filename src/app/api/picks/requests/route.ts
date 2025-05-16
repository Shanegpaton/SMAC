import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const picks = await prisma.sMACArticle.findMany({
      where: {
        publishRequest: true,
        published: false,
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(picks);
  } catch (error) {
    console.error('Error fetching pick requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pick requests' },
      { status: 500 }
    );
  }
} 