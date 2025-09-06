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

    // Calculate winnings and yield for the new result
    let newWinnings = 0;
    let yieldAmount = 0;

    if (result === 'win') {
      if (pick.odds > 0) {
        // For positive odds: (odds/100 * stake) + stake
        newWinnings = Math.floor((pick.odds * pick.smacCoins) / 100) + pick.smacCoins;
        yieldAmount = pick.odds;
      } else {
        // For negative odds: (100/|odds| * stake) + stake
        newWinnings = Math.floor((100 * pick.smacCoins) / Math.abs(pick.odds)) + pick.smacCoins;
        yieldAmount = (100 * 100) / Math.abs(pick.odds);
      }
    } else if (result === 'push') {
      // For a push, return the original stake
      newWinnings = pick.smacCoins;
      yieldAmount = 0;
    } else {
      newWinnings = 0;
      yieldAmount = -100;
    }

    // Calculate what the user previously received (if any)
    let previousWinnings = 0;
    if (pick.result === 'win') {
      if (pick.odds > 0) {
        previousWinnings = Math.floor((pick.odds * pick.smacCoins) / 100) + pick.smacCoins;
      } else {
        previousWinnings = Math.floor((100 * pick.smacCoins) / Math.abs(pick.odds)) + pick.smacCoins;
      }
    } else if (pick.result === 'push') {
      previousWinnings = pick.smacCoins;
    }

    // Calculate the difference in winnings
    const winningsDifference = newWinnings - previousWinnings;

    console.log('Calculated values:', {
      result,
      previousResult: pick.result,
      odds: pick.odds,
      stake: pick.smacCoins,
      previousWinnings,
      newWinnings,
      winningsDifference,
      yieldAmount
    });

    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin or if they own this pick
    const isAdmin = currentUser.isAdmin;
    const isOwner = pick.userId === currentUser.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'You can only update your own picks' },
        { status: 403 }
      );
    }

    // Use the pick owner's user for SMAC coins updates
    const targetUser = pick.user;

    console.log('Target user before update:', {
      id: targetUser.id,
      email: targetUser.email,
      smacCoins: targetUser.smacCoins,
      isAdmin,
      isOwner
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

      // Update user's SMAC coins based on the difference
      if (winningsDifference !== 0) {
        const updatedUser = await tx.user.update({
          where: { id: targetUser.id },
          data: {
            smacCoins: {
              increment: winningsDifference,
            },
          },
        });

        console.log('Updated user SMAC coins:', {
          userId: targetUser.id,
          oldBalance: targetUser.smacCoins,
          winningsDifference,
          newBalance: updatedUser.smacCoins
        });

        // Validate the balance change
        const expectedBalance = targetUser.smacCoins + winningsDifference;
        if (updatedUser.smacCoins !== expectedBalance) {
          throw new Error(`SMAC coins balance mismatch. Expected: ${expectedBalance}, Got: ${updatedUser.smacCoins}`);
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