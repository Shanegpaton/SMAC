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
      // For a win, user gets profit + original stake back
      const profit = pick.odds > 0 
        ? Math.floor((pick.odds * pick.smacCoins) / 100)
        : Math.floor((100 * pick.smacCoins) / Math.abs(pick.odds));
      winnings = profit + pick.smacCoins; // Profit + original stake
      // Align yield calc with user SMAC picks: use exact percentage without flooring
      yieldAmount = pick.odds > 0 ? pick.odds : (100 * 100) / Math.abs(pick.odds);
    } else if (result === 'push') {
      // For a push, user gets their original stake back
      winnings = pick.smacCoins;
      yieldAmount = 0;
    } else if (result === 'loss') {
      // For a loss, user gets nothing back
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
        // For a win, give user profit + original stake, and add profit to global balance
        const profit = winnings - pick.smacCoins; // Extract just the profit portion
        
        await tx.user.update({
          where: { id: pick.authorId },
          data: {
            smacCoins: {
              increment: winnings // Profit + original stake
            }
          }
        });

        // Add only the profit to global balance (not the original stake)
        await tx.globalSMACCoins.update({
          where: { id: globalSMACCoins.id },
          data: {
            balance: {
              increment: profit
            }
          }
        });

        console.log('Updated balances for win:', {
          userId: pick.authorId,
          userOldBalance: pick.author.smacCoins,
          userWinnings: winnings,
          userNewBalance: pick.author.smacCoins + winnings,
          globalOldBalance: globalSMACCoins.balance,
          globalProfit: profit,
          globalNewBalance: globalSMACCoins.balance + profit
        });
      } else if (result === 'push') {
        // For a push, give user their stake back, no global balance change
        await tx.user.update({
          where: { id: pick.authorId },
          data: {
            smacCoins: {
              increment: pick.smacCoins
            }
          }
        });

        console.log('Returned stake to user for push:', {
          userId: pick.authorId,
          userOldBalance: pick.author.smacCoins,
          stakeReturned: pick.smacCoins,
          userNewBalance: pick.author.smacCoins + pick.smacCoins
        });
      } else if (result === 'loss') {
        // For a loss, user gets nothing, no global balance change
        console.log('User lost their stake for loss:', {
          userId: pick.authorId,
          stakeLost: pick.smacCoins,
          userBalance: pick.author.smacCoins
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