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

    const body = await request.json();
    const resultInput = body?.result as string | null | undefined;
    const result: 'win' | 'loss' | 'push' | null = (resultInput === '' || resultInput === null)
      ? null
      : (resultInput as 'win' | 'loss' | 'push');
    if (result !== null && !['win', 'loss', 'push'].includes(result)) {
      return NextResponse.json(
        { error: 'Invalid result. Must be "win", "loss", "push", or empty for no result' },
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

    // Calculate new result effects
    let winnings = 0;
    let yieldAmount: number | null = null;
    const profitFor = (odds: number, stake: number) =>
      odds > 0
        ? Math.floor((odds * stake) / 100)
        : Math.floor((100 * stake) / Math.abs(odds));

    if (result === 'win') {
      const profit = profitFor(pick.odds, pick.smacCoins);
      winnings = profit + pick.smacCoins; // Profit + original stake
      yieldAmount = pick.odds > 0 ? pick.odds : (100 * 100) / Math.abs(pick.odds);
    } else if (result === 'push') {
      winnings = pick.smacCoins; // stake back
      yieldAmount = 0;
    } else if (result === 'loss') {
      winnings = 0; // no return
      yieldAmount = -100;
    } else {
      // Clearing result: no winnings and no yield
      winnings = 0;
      yieldAmount = null;
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
      // Determine delta to global based on previous vs new result
      const prev: 'win' | 'loss' | 'push' | null = pick.result as any;
      const amountFor = (r: string | null) => {
        if (r === 'win') return profitFor(pick.odds, pick.smacCoins) + pick.smacCoins;
        if (r === 'push') return pick.smacCoins;
        return 0; // loss or null (no result)
      };
      const prevAmount = amountFor(prev);
      const newAmount = amountFor(result);
      const delta = newAmount - prevAmount;

      // Update the pick
      const updatedPick = await tx.sMACPick.update({
        where: { id: pick.id },
        data: {
          result: result,
          yield: yieldAmount,
        },
      });

      // Apply only the delta to the global pool
      if (delta !== 0) {
        await tx.globalSMACCoins.update({
          where: { id: globalSMACCoins.id },
          data: { balance: { increment: delta } },
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