import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    const pick = await prisma.sMACArticle.update({
      where: { id },
      data: {
        publishRequest: false,
      },
    });

    return NextResponse.json(pick);
  } catch (error) {
    console.error('Error rejecting pick:', error);
    return NextResponse.json(
      { error: 'Failed to reject pick' },
      { status: 500 }
    );
  }
} 