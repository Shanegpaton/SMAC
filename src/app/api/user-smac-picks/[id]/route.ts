import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
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

    const pickId = params.id;

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
