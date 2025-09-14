import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to view picks' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can view individual picks' },
        { status: 403 }
      );
    }

    const { id: pickId } = await params;

    const pick = await prisma.userSMACPick.findUnique({
      where: { id: pickId },
      include: { user: true }
    });

    if (!pick) {
      return NextResponse.json(
        { error: 'Pick not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(pick);
  } catch (error) {
    console.error('Error fetching pick:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pick' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update picks' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can update picks' },
        { status: 403 }
      );
    }

    const { id: pickId } = await params;
    const body = await request.json();

    // Check if the pick exists
    const existingPick = await prisma.userSMACPick.findUnique({
      where: { id: pickId },
      include: { user: true }
    });

    if (!existingPick) {
      return NextResponse.json(
        { error: 'Pick not found' },
        { status: 404 }
      );
    }

    // Calculate what the user previously received (if any)
    let previousWinnings = 0;
    if (existingPick.result === 'win') {
      if (existingPick.odds > 0) {
        previousWinnings = Math.floor((existingPick.odds * existingPick.smacCoins) / 100);
      } else {
        previousWinnings = Math.floor((100 * existingPick.smacCoins) / Math.abs(existingPick.odds));
      }
    } else if (existingPick.result === 'push') {
      previousWinnings = 0; // They got their stake back, no profit
    } else if (existingPick.result === 'loss') {
      previousWinnings = -existingPick.smacCoins; // They lost their stake
    }

    // Calculate what they should receive with the new values
    let newWinnings = 0;
    if (body.result === 'win') {
      if (body.odds > 0) {
        newWinnings = Math.floor((body.odds * body.smacCoins) / 100);
      } else {
        newWinnings = Math.floor((100 * body.smacCoins) / Math.abs(body.odds));
      }
    } else if (body.result === 'push') {
      newWinnings = 0; // They get their stake back, no profit
    } else if (body.result === 'loss') {
      newWinnings = -body.smacCoins; // They lose their stake
    }

    // Calculate the difference in winnings
    const winningsDifference = newWinnings - previousWinnings;

    // Calculate yield based on result and odds
    let calculatedYield = null;
    if (body.result === 'win') {
      if (body.odds > 0) {
        calculatedYield = body.odds;
      } else {
        calculatedYield = Math.floor((100 * 100) / Math.abs(body.odds));
      }
    } else if (body.result === 'loss') {
      calculatedYield = -100;
    } else if (body.result === 'push') {
      calculatedYield = 0;
    }

    console.log('Pick update calculation:', {
      pickId,
      userId: existingPick.userId,
      previousResult: existingPick.result,
      previousOdds: existingPick.odds,
      previousStake: existingPick.smacCoins,
      previousWinnings,
      newResult: body.result,
      newOdds: body.odds,
      newStake: body.smacCoins,
      newWinnings,
      winningsDifference,
      currentBalance: existingPick.user.smacCoins
    });

    // Update the pick and adjust user's SMAC coins in a transaction
    const updatedPick = await prisma.$transaction(async (tx) => {
      // Update the pick
      const updated = await tx.userSMACPick.update({
        where: { id: pickId },
        data: {
          date: body.date,
          sport: body.sport,
          game: body.game,
          bet: body.bet,
          odds: body.odds,
          smacCoins: body.smacCoins,
          result: body.result || null,
          yield: calculatedYield,
          weekNumber: body.weekNumber,
          year: body.year
        },
        include: { user: true }
      });

      // Update user's SMAC coins based on the difference
      if (winningsDifference !== 0) {
        const updatedUser = await tx.user.update({
          where: { id: existingPick.userId },
          data: {
            smacCoins: {
              increment: winningsDifference,
            },
          },
        });

        console.log('Updated user SMAC coins after pick edit:', {
          userId: existingPick.userId,
          oldBalance: existingPick.user.smacCoins,
          winningsDifference,
          newBalance: updatedUser.smacCoins
        });

        // Validate the balance change
        const expectedBalance = existingPick.user.smacCoins + winningsDifference;
        if (updatedUser.smacCoins !== expectedBalance) {
          throw new Error(`SMAC coins balance mismatch. Expected: ${expectedBalance}, Got: ${updatedUser.smacCoins}`);
        }
      }

      return updated;
    });

    console.log(`Admin ${session.user.name} updated pick ${pickId} for user ${existingPick.user.name} and adjusted SMAC coins by ${winningsDifference}`);

    return NextResponse.json(updatedPick);
  } catch (error) {
    console.error('Error updating pick:', error);
    return NextResponse.json(
      { error: 'Failed to update pick' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete picks' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can delete picks' },
        { status: 403 }
      );
    }

    const { id: pickId } = await params;

    // Check if the pick exists
    const existingPick = await prisma.userSMACPick.findUnique({
      where: { id: pickId },
      include: { user: true }
    });

    if (!existingPick) {
      return NextResponse.json(
        { error: 'Pick not found' },
        { status: 404 }
      );
    }

    // Calculate SMAC coins adjustment for deletion
    // Deleting a pick should be like the user never placed the bet
    // So we need to return their original stake and remove any winnings they received
    
    let smacCoinsAdjustment = 0;
    
    if (existingPick.result === 'win') {
      // User won: they got profit + stake, we need to remove profit only
      // So they get their original stake back (net effect: -profit)
      if (existingPick.odds > 0) {
        const profit = Math.floor((existingPick.odds * existingPick.smacCoins) / 100);
        smacCoinsAdjustment = -profit; // Remove only the profit, keep the stake
      } else {
        const profit = Math.floor((100 * existingPick.smacCoins) / Math.abs(existingPick.odds));
        smacCoinsAdjustment = -profit; // Remove only the profit, keep the stake
      }
    } else if (existingPick.result === 'push') {
      // User pushed: they got their stake back, no adjustment needed
      smacCoinsAdjustment = 0;
    } else if (existingPick.result === 'loss') {
      // User lost: they lost their stake, we need to return it
      smacCoinsAdjustment = existingPick.smacCoins; // Return the original stake
    } else {
      // Pending: user hasn't lost anything yet, no adjustment needed
      smacCoinsAdjustment = 0;
    }

    console.log('Deleting pick with SMAC coins adjustment:', {
      pickId,
      userId: existingPick.userId,
      result: existingPick.result,
      stake: existingPick.smacCoins,
      odds: existingPick.odds,
      smacCoinsAdjustment,
      currentBalance: existingPick.user.smacCoins
    });

    // Delete the pick and adjust user's SMAC coins in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the pick
      await tx.userSMACPick.delete({
        where: { id: pickId }
      });

      // Adjust user's SMAC coins based on the deletion
      if (smacCoinsAdjustment !== 0) {
        const updatedUser = await tx.user.update({
          where: { id: existingPick.userId },
          data: {
            smacCoins: {
              increment: smacCoinsAdjustment,
            },
          },
        });

        console.log('Adjusted user SMAC coins after deletion:', {
          userId: existingPick.userId,
          oldBalance: existingPick.user.smacCoins,
          adjustment: smacCoinsAdjustment,
          newBalance: updatedUser.smacCoins
        });

        // Validate the balance change
        const expectedBalance = existingPick.user.smacCoins + smacCoinsAdjustment;
        if (updatedUser.smacCoins !== expectedBalance) {
          throw new Error(`SMAC coins balance mismatch. Expected: ${expectedBalance}, Got: ${updatedUser.smacCoins}`);
        }
      }
    });

    console.log(`Admin ${session.user.name} deleted pick ${pickId} for user ${existingPick.user.name} and adjusted SMAC coins by ${smacCoinsAdjustment}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pick:', error);
    return NextResponse.json(
      { error: 'Failed to delete pick' },
      { status: 500 }
    );
  }
}
