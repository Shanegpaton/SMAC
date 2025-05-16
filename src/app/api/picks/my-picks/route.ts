import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
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

    const picks = await prisma.sMACArticle.findMany({
      where: {
        authorId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(picks);
  } catch (error) {
    console.error('Error fetching user picks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch your picks' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update picks' },
        { status: 401 }
      );
    }

    const { id, published } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Pick ID is required' },
        { status: 400 }
      );
    }

    const updatedPick = await prisma.sMACArticle.update({
      where: { id },
      data: { published },
    });

    return NextResponse.json(updatedPick);
  } catch (error) {
    console.error('Error updating pick:', error);
    return NextResponse.json(
      { error: 'Failed to update pick' },
      { status: 500 }
    );
  }
} 