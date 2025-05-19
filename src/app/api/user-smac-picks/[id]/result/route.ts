import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Helper function to get or create SMAC coins record
async function getOrCreateSMACCoins() {
  let smacCoins = await prisma.globalSMACCoins.findFirst();
  if (!smacCoins) {
    smacCoins = await prisma.globalSMACCoins.create({
      data: {
        balance: 1000, // Default starting balance
      },
    });
  }
  return smacCoins;
}

// Helper function to calculate yield
function calculateYield(result: string, odds: number, stake: number): number {
  if (result === 'win') {
    const profit = odds > 0 
      ? stake * (odds / 100)
      : stake * (100 / Math.abs(odds));
    return Number(((profit / stake) * 100).toFixed(2));
  }
  if (result === 'loss') {
    return -100;
  }
  return 0;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { result } = await request.json();
    if (!result || !['win', 'loss', 'push'].includes(result)) {
      return NextResponse.json(
        { error: 'Invalid result. Must be either "win", "loss", or "push"' },
        { status: 400 }
      );
    }

    // Get the pick and ensure it exists
    const pick = await prisma.userSMACPick.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!pick) {
      return NextResponse.json({ error: 'Pick not found' }, { status: 404 });
    }

    console.log('Found pick:', {
      id: pick.id,
      userId: pick.userId,
      userEmail: pick.user.email,
      currentUserEmail: session.user.email
    });

    // Calculate winnings and yield
    let winnings = 0;
    let yieldAmount = 0;

    if (result === 'win') {
      if (pick.odds > 0) {
        // For positive odds: (odds/100 * stake) + stake
        winnings = Math.floor((pick.odds * pick.smacCoins) / 100) + pick.smacCoins;
        yieldAmount = pick.odds;
      } else {
        // For negative odds: (100/|odds| * stake) + stake
        winnings = Math.floor((100 * pick.smacCoins) / Math.abs(pick.odds)) + pick.smacCoins;
        yieldAmount = (100 * 100) / Math.abs(pick.odds);
      }
    } else if (result === 'push') {
      // For a push, return the original stake
      winnings = pick.smacCoins;
      yieldAmount = 0;
    } else {
      winnings = 0;
      yieldAmount = -100;
    }

    console.log('Calculated values:', {
      result,
      odds: pick.odds,
      stake: pick.smacCoins,
      winnings,
      yieldAmount
    });

    // First get the current user to verify their SMAC coins
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Current user before update:', {
      id: currentUser.id,
      email: currentUser.email,
      smacCoins: currentUser.smacCoins
    });

    // Update the pick and user's SMAC coins in a transaction
    const updatedPick = await prisma.$transaction(async (tx) => {
      // Update the pick
      const updated = await tx.userSMACPick.update({
        where: { id: params.id },
        data: {
          result,
          yield: yieldAmount,
        },
      });

      // Update user's SMAC coins for win or push
      if (result === 'win' || result === 'push') {
        const updatedUser = await tx.user.update({
          where: { id: currentUser.id },
          data: {
            smacCoins: {
              increment: winnings,
            },
          },
        });

        console.log('Updated user SMAC coins:', {
          userId: currentUser.id,
          oldBalance: currentUser.smacCoins,
          winnings,
          newBalance: updatedUser.smacCoins
        });

        if (updatedUser.smacCoins <= currentUser.smacCoins) {
          throw new Error('SMAC coins balance did not increase');
        }
      }

      return updated;
    });

    return NextResponse.json(updatedPick);
  } catch (error) {
    console.error('Error updating pick result:', error);
    return NextResponse.json(
      { error: 'Failed to update pick result' },
      { status: 500 }
    );
  }
} 