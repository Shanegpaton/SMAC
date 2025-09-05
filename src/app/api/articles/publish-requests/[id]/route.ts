import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action } = await request.json();
    const articleId = params.id;

    if (action === 'approve') {
      const article = await prisma.sMACArticle.update({
        where: { id: articleId },
        data: {
          published: true,
          publishRequest: false,
          publishedAt: new Date(),
        },
      });

      return NextResponse.json(article);
    } else if (action === 'reject') {
      const article = await prisma.sMACArticle.update({
        where: { id: articleId },
        data: {
          publishRequest: false,
        },
      });

      return NextResponse.json(article);
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error handling article request:', error);
    return NextResponse.json(
      { error: 'Failed to handle article request' },
      { status: 500 }
    );
  }
} 