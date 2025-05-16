import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'You must be an admin to update picks' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { result, yield: yieldValue } = body;

    const pick = await prisma.sMACPick.update({
      where: { id: params.id },
      data: {
        result,
        yield: yieldValue,
      },
    });

    return NextResponse.json(pick);
  } catch (error) {
    console.error('Error updating SMAC pick:', error);
    return NextResponse.json(
      { error: 'Failed to update SMAC pick' },
      { status: 500 }
    );
  }
} 