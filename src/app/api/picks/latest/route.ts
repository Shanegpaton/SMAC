import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const latestPick = await prisma.sMACArticle.findFirst({
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

    if (!latestPick) {
      return NextResponse.json({ error: 'No picks found' }, { status: 404 });
    }

    return NextResponse.json(latestPick);
  } catch (error) {
    console.error('Error fetching latest pick:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest pick' },
      { status: 500 }
    );
  }
} 