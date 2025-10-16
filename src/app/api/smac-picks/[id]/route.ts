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
    const { result } = body as { result: 'win' | 'loss' | 'push' };

    if (!result || !['win', 'loss', 'push'].includes(result)) {
      return NextResponse.json(
        { error: 'Invalid result. Must be either "win", "loss", or "push"' },
        { status: 400 }
      );
    }

    // Load pick with author for balance updates
    const existingPick = await prisma.sMACPick.findUnique({
      where: { id: params.id },
      include: { author: true },
    });

    if (!existingPick) {
      return NextResponse.json({ error: 'Pick not found' }, { status: 404 });
    }

    // Calculate winnings (profit + stake for win, stake for push, 0 for loss)
    let winnings = 0;
    let yieldAmount = 0;
    if (result === 'win') {
      const profit = existingPick.odds > 0
        ? Math.floor((existingPick.odds * existingPick.smacCoins) / 100)
        : Math.floor((100 * existingPick.smacCoins) / Math.abs(existingPick.odds));
      winnings = profit + existingPick.smacCoins;
      yieldAmount = existingPick.odds > 0 ? existingPick.odds : (100 * 100) / Math.abs(existingPick.odds);
    } else if (result === 'push') {
      winnings = existingPick.smacCoins; // return stake
      yieldAmount = 0;
    } else {
      winnings = 0;
      yieldAmount = -100;
    }

    // Ensure there is a global SMAC coins record
    let globalSMAC = await prisma.globalSMACCoins.findFirst();
    if (!globalSMAC) {
      globalSMAC = await prisma.globalSMACCoins.create({ data: { balance: 1000 } });
    }

    // Apply updates in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      const updatedPick = await tx.sMACPick.update({
        where: { id: existingPick.id },
        data: { result, yield: yieldAmount },
      });

      if (result === 'win') {
        // Global account gets stake + profit back
        await tx.globalSMACCoins.update({
          where: { id: globalSMAC!.id },
          data: { balance: { increment: winnings } },
        });
      } else if (result === 'push') {
        // Return stake to global account
        await tx.globalSMACCoins.update({
          where: { id: globalSMAC!.id },
          data: { balance: { increment: existingPick.smacCoins } },
        });
      } else {
        // loss: stake already deducted at creation; no change
      }

      return updatedPick;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating SMAC pick:', error);
    return NextResponse.json(
      { error: 'Failed to update SMAC pick' },
      { status: 500 }
    );
  }
} 