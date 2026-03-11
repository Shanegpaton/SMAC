import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pick = await prisma.sMACPick.findUnique({
      where: { id: resolvedParams.id },
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    if (!pick) {
      return NextResponse.json({ error: 'Pick not found' }, { status: 404 });
    }

    return NextResponse.json(pick);
  } catch (error) {
    console.error('Error fetching SMAC pick:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMAC pick' },
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
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'You must be an admin to update picks' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let { result } = body as { result?: 'win' | 'loss' | 'push' | '' | null };
    if (result === '') result = null as any;

    // Load pick with author for updates
    const existingPick = await prisma.sMACPick.findUnique({
      where: { id: resolvedParams.id },
      include: { author: true },
    });

    if (!existingPick) {
      return NextResponse.json({ error: 'Pick not found' }, { status: 404 });
    }

    // If no result provided, treat this as a details update only
    if (!result) {
      const updateData: any = {};
      if (body.date) updateData.date = new Date(body.date);
      if (typeof body.sport === 'string') updateData.sport = body.sport;
      if (typeof body.game === 'string') updateData.game = body.game;
      if (typeof body.bet === 'string') updateData.bet = body.bet;
      if (typeof body.odds === 'number') updateData.odds = body.odds;
      if (typeof body.smacCoins === 'number') updateData.smacCoins = body.smacCoins;
      if (typeof body.weekNumber === 'number') updateData.weekNumber = body.weekNumber;
      if (typeof body.year === 'number') updateData.year = body.year;

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(existingPick);
      }

      // If the pick already has a result of win, and odds/stake change,
      // adjust the global balance by the change in profit only. Also refresh yield.
      const willAffectPayout = existingPick.result === 'win' && (
        typeof updateData.odds === 'number' || typeof updateData.smacCoins === 'number'
      );
      // If the pick is a loss and stake changes, adjust the global balance by the stake delta
      const willAffectLossStake = existingPick.result === 'loss' && (
        typeof updateData.smacCoins === 'number'
      );
      // If the pick has no result (pending) and stake changes, adjust the global pool by stake delta
      const willAffectPendingStake = (existingPick.result === null || existingPick.result === undefined) && (
        typeof updateData.smacCoins === 'number'
      );

      const newOdds = typeof updateData.odds === 'number' ? updateData.odds : existingPick.odds;
      const newStake = typeof updateData.smacCoins === 'number' ? updateData.smacCoins : existingPick.smacCoins;

      // Compute existing and new profits using same rounding as elsewhere
      const computeProfit = (odds: number, stake: number) =>
        odds > 0
          ? Math.floor((odds * stake) / 100)
          : Math.floor((100 * stake) / Math.abs(odds));

      let profitDelta = 0;
      let lossStakeDelta = 0;
      let pendingStakeDelta = 0;
      if (willAffectPayout) {
        const oldProfit = computeProfit(existingPick.odds, existingPick.smacCoins);
        const newProfit = computeProfit(newOdds, newStake);
        profitDelta = newProfit - oldProfit;
        // Update yield to reflect new odds
        const newYield = newOdds > 0 ? newOdds : (100 * 100) / Math.abs(newOdds);
        updateData.yield = newYield;
      }
      if (willAffectLossStake) {
        // Positive delta means increasing stake on a loss -> further decrement global
        lossStakeDelta = newStake - existingPick.smacCoins;
      }
      if (willAffectPendingStake) {
        // Stake is reserved from global on creation; adjust reservation by delta
        pendingStakeDelta = newStake - existingPick.smacCoins;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const updatedPick = await tx.sMACPick.update({
          where: { id: existingPick.id },
          data: updateData,
        });

        if ((willAffectPayout && profitDelta !== 0) || (willAffectLossStake && lossStakeDelta !== 0) || (willAffectPendingStake && pendingStakeDelta !== 0)) {
          // Adjust global pool by combined delta: profit change + inverse of loss stake delta
          let global = await tx.globalSMACCoins.findFirst();
          if (!global) {
            global = await tx.globalSMACCoins.create({ data: { balance: 1000 } });
          }
          const incrementBy = profitDelta
            + (willAffectLossStake ? -lossStakeDelta : 0)
            + (willAffectPendingStake ? -pendingStakeDelta : 0);
          if (incrementBy !== 0) {
            await tx.globalSMACCoins.update({
              where: { id: global.id },
              data: {
                balance: { increment: incrementBy },
              },
            });
          }
        }

        return updatedPick;
      });
      return NextResponse.json(updated);
    }

    // Calculate winnings (profit + stake for win, stake for push, 0 for loss)
    let winnings = 0;
    let yieldAmount: number | null = null;
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
      if (result === 'loss') {
        winnings = 0;
        yieldAmount = -100;
      } else {
        // clearing to no result
        winnings = 0;
        yieldAmount = null;
      }
    }

    // Ensure there is a global SMAC coins record
    let globalSMAC = await prisma.globalSMACCoins.findFirst();
    if (!globalSMAC) {
      globalSMAC = await prisma.globalSMACCoins.create({ data: { balance: 1000 } });
    }

    // Apply updates in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Compute delta vs previous result
      const prev = existingPick.result;
      const amountFor = (r: string | null) => {
        if (r === 'win') {
          const profit = existingPick.odds > 0
            ? Math.floor((existingPick.odds * existingPick.smacCoins) / 100)
            : Math.floor((100 * existingPick.smacCoins) / Math.abs(existingPick.odds));
          return profit + existingPick.smacCoins;
        }
        if (r === 'push') return existingPick.smacCoins;
        return 0; // loss or null
      };
      const prevAmount = amountFor(prev);
      const newAmount = amountFor(result);
      const delta = newAmount - prevAmount;

      const updatedPick = await tx.sMACPick.update({
        where: { id: existingPick.id },
        data: { result: result as any, yield: yieldAmount as any },
      });

      if (delta !== 0) {
        await tx.globalSMACCoins.update({
          where: { id: globalSMAC!.id },
          data: { balance: { increment: delta } },
        });
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