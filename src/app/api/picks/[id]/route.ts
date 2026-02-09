import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { uploadImage } from '@/lib/uploadImage'; // Import the uploadImage function

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const pick = await prisma.sMACArticle.findUnique({
      where: { id: resolvedParams.id },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!pick) {
      return NextResponse.json({ error: 'Pick not found' }, { status: 404 });
    }

    return NextResponse.json(pick);
  } catch (error) {
    console.error('Error fetching pick:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pick' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update picks' },
        { status: 401 }
      );
    }

    const pick = await prisma.SMACArticle.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!pick) {
      return NextResponse.json({ error: 'Pick not found' }, { status: 404 });
    }

    if (pick.authorId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'You can only update your own picks' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('📨 PATCH body:', body);

    const updated = await prisma.SMACArticle.update({
      where: { id: resolvedParams.id },
      data: {
        title: body.title,
        gameDate: body.gameDate ? new Date(body.gameDate) : undefined,
        homeTeam: body.homeTeam,
        awayTeam: body.awayTeam,
        pick: body.pick,
        reasoning: body.reasoning,
        imageUrl: body.imageUrl,
        published: body.published,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('❌ PATCH ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to update pick', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete picks' },
        { status: 401 }
      );
    }

    const pick = await prisma.sMACArticle.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!pick) {
      return NextResponse.json({ error: 'Pick not found' }, { status: 404 });
    }

    if (pick.authorId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'You can only delete your own picks' },
        { status: 403 }
      );
    }

    await prisma.sMACArticle.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ message: 'Pick deleted successfully' });
  } catch (error) {
    console.error('Error deleting pick:', error);
    return NextResponse.json(
      { error: 'Failed to delete pick' },
      { status: 500 }
    );
  }
} 