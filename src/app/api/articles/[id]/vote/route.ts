import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { vote } = await request.json();

    // Validate vote value
    if (vote !== 1 && vote !== -1) {
      return NextResponse.json({ error: 'Invalid vote value' }, { status: 400 });
    }

    // Check if article exists
    const article = await prisma.sMACArticle.findUnique({
      where: { id },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check if user already voted
    const existingVote = await prisma.articleVote.findUnique({
      where: {
        userId_articleId: {
          userId: session.user.id,
          articleId: id,
        },
      },
    });

    if (existingVote) {
      // Update existing vote
      if (existingVote.vote === vote) {
        // Remove vote if clicking same button
        await prisma.articleVote.delete({
          where: { id: existingVote.id },
        });
        return NextResponse.json({ message: 'Vote removed' });
      } else {
        // Change vote
        await prisma.articleVote.update({
          where: { id: existingVote.id },
          data: { vote },
        });
        return NextResponse.json({ message: 'Vote updated' });
      }
    } else {
      // Create new vote
      await prisma.articleVote.create({
        data: {
          vote,
          userId: session.user.id,
          articleId: id,
        },
      });
      return NextResponse.json({ message: 'Vote created' });
    }
  } catch (error) {
    console.error('Error handling vote:', error);
    
    // Check if it's a table doesn't exist error
    if (error instanceof Error && error.message.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database tables not created yet. Please run the SQL migration in Supabase.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get vote counts
    const upvotes = await prisma.articleVote.count({
      where: { articleId: id, vote: 1 },
    });

    const downvotes = await prisma.articleVote.count({
      where: { articleId: id, vote: -1 },
    });

    const session = await getServerSession(authOptions);
    let userVote = null;

    if (session?.user?.id) {
      const userVoteRecord = await prisma.articleVote.findUnique({
        where: {
          userId_articleId: {
            userId: session.user.id,
            articleId: id,
          },
        },
      });
      userVote = userVoteRecord?.vote || null;
    }

    return NextResponse.json({
      upvotes,
      downvotes,
      userVote,
    });
  } catch (error) {
    console.error('Error fetching votes:', error);
    
    // Check if it's a table doesn't exist error
    if (error instanceof Error && error.message.includes('does not exist')) {
      return NextResponse.json({
        upvotes: 0,
        downvotes: 0,
        userVote: null,
      });
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
