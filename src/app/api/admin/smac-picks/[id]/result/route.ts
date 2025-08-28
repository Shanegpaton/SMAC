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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'You must be an admin to update SMAC picks' },
        { status: 401 }
      );
    }

    const { result } = await request.json();
    if (!result || !['win', 'loss', 'push'].includes(result)) {
      return NextResponse.json(
        { error: 'Invalid result. Must be either "win", "loss", or "push"' },
        { status: 400 }
      );
    }

    // Get the pick and ensure it exists
    const pick = await prisma.sMACPick.findUnique({
      where: { id: resolvedParams.id },
      include: { author: true }
    });

    if (!pick) {
      return NextResponse.json({ error: 'Pick not found' }, { status: 404 });
    }

    console.log('Found pick:', {
      id: pick.id,
      userId: pick.authorId,
      userEmail: pick.author.email,
      currentUserEmail: session.user.email
    });

    // Calculate winnings and yield
    let winnings = 0;
    let yieldAmount = 0;

    if (result === 'win') {
      winnings = pick.odds > 0 
        ? pick.smacCoins * (pick.odds / 100)
        : pick.smacCoins * (100 / Math.abs(pick.odds));
      yieldAmount = Number(((winnings / pick.smacCoins) * 100).toFixed(2));
    } else if (result === 'push') {
      winnings = pick.smacCoins;
      yieldAmount = 0;
    } else if (result === 'loss') {
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

    // Get the global SMAC coins record
    const globalSMACCoins = await getOrCreateSMACCoins();

    // Update the pick and user's SMAC coins in a transaction
    const updatedPick = await prisma.$transaction(async (tx) => {
      // Update the pick
      const updatedPick = await tx.sMACPick.update({
        where: { id: pick.id },
        data: {
          result,
          yield: yieldAmount,
        },
      });

      if (result === 'win') {
        // For a win, update user's SMAC coins and global balance
        await tx.user.update({
          where: { id: pick.authorId },
          data: {
            smacCoins: {
              increment: winnings
            }
          }
        });

        // Add winnings to global balance
        await tx.globalSMACCoins.update({
          where: { id: globalSMACCoins.id },
          data: {
            balance: {
              increment: winnings
            }
          }
        });

        console.log('Updated balances for win:', {
          userId: pick.authorId,
          userOldBalance: pick.author.smacCoins,
          userWinnings: winnings,
          userNewBalance: pick.author.smacCoins + winnings,
          globalOldBalance: globalSMACCoins.balance,
          globalWinnings: winnings,
          globalNewBalance: globalSMACCoins.balance + winnings
        });
      } else if (result === 'push') {
        // For a push, return SMAC coins to global balance
        await tx.globalSMACCoins.update({
          where: { id: globalSMACCoins.id },
          data: {
            balance: {
              increment: pick.smacCoins
            }
          }
        });

        console.log('Returned SMAC coins to global balance for push:', {
          amount: pick.smacCoins,
          oldBalance: globalSMACCoins.balance,
          newBalance: globalSMACCoins.balance + pick.smacCoins
        });
      }

      return updatedPick;
    });

    return NextResponse.json(updatedPick);
  } catch (error) {
    console.error('Error updating SMAC pick:', error);
    return NextResponse.json(
      { error: 'Failed to update SMAC pick' },
      { status: 500 }
    );
  }
} 