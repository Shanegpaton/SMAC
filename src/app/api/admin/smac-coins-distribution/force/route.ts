import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    console.log('=== Starting Force Distribution ===');
    console.log('Session user:', session?.user?.email);

    if (!session?.user?.email) {
      console.log('No session or email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    console.log('Admin check:', {
      email: user?.email,
      isAdmin: user?.isAdmin
    });

    if (!user?.isAdmin) {
      console.log('User is not admin:', session.user.email);
      return NextResponse.json(
        { error: 'You must be an admin to force distribution' },
        { status: 401 }
      );
    }

    // Get distribution settings
    const distribution = await prisma.SMACCoinsDistribution.findFirst();
    console.log('Distribution settings:', {
      id: distribution?.id,
      isActive: distribution?.isActive,
      weeklyAmount: distribution?.weeklyAmount,
      lastDistributed: distribution?.lastDistributed
    });

    if (!distribution?.isActive) {
      console.log('Distribution is not active');
      return NextResponse.json({ error: 'Distribution is not active' }, { status: 400 });
    }

    // Get all users and their current SMAC coins
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        smacCoins: true
      }
    });
    console.log('Current user balances:', users.map(u => ({
      email: u.email,
      currentBalance: u.smacCoins
    })));

    try {
      // Update all users' SMAC coins in a transaction
      const result = await prisma.$transaction(async (tx) => {
        console.log('Inside transaction - updating users...');
        
        // Update each user's SMAC coins
        const updatePromises = users.map(async user => {
          console.log(`Updating user ${user.email}...`);
          try {
            const updatedUser = await tx.user.update({
              where: { id: user.id },
              data: {
                smacCoins: {
                  increment: distribution.weeklyAmount
                }
              },
              select: {
                id: true,
                email: true,
                smacCoins: true
              }
            });
            console.log(`Updated user ${user.email}:`, {
              oldBalance: user.smacCoins,
              newBalance: updatedUser.smacCoins,
              added: distribution.weeklyAmount
            });
            return updatedUser;
          } catch (error) {
            console.error(`Error updating user ${user.email}:`, error);
            throw error;
          }
        });

        // Update the last distributed timestamp
        const updateDistribution = tx.SMACCoinsDistribution.update({
          where: { id: distribution.id },
          data: { lastDistributed: new Date() }
        });

        // Wait for all updates to complete
        const [updatedUsers, updatedDistribution] = await Promise.all([
          Promise.all(updatePromises),
          updateDistribution
        ]);

        console.log('Transaction completed successfully');
        console.log('Updated distribution:', {
          id: updatedDistribution.id,
          lastDistributed: updatedDistribution.lastDistributed
        });

        return { updatedUsers, updatedDistribution };
      });

      // Verify the updates immediately after transaction
      const verifiedUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          smacCoins: true
        }
      });
      console.log('Final verified balances:', verifiedUsers.map(u => ({
        email: u.email,
        finalBalance: u.smacCoins
      })));

      // Double check that the balances actually increased
      const balanceCheck = verifiedUsers.every(user => {
        const originalUser = users.find(u => u.id === user.id);
        return user.smacCoins === (originalUser?.smacCoins || 0) + distribution.weeklyAmount;
      });

      if (!balanceCheck) {
        console.error('Balance verification failed - some users did not receive their coins');
        throw new Error('Failed to verify coin distribution');
      }

      console.log('=== Force Distribution Complete ===');

      return NextResponse.json({
        success: true,
        message: `Successfully distributed ${distribution.weeklyAmount} SMAC coins to ${users.length} users`,
        users: verifiedUsers.map(u => ({
          email: u.email,
          newBalance: u.smacCoins
        }))
      });
    } catch (transactionError) {
      console.error('Transaction failed:', transactionError);
      throw transactionError;
    }
  } catch (error) {
    console.error('Error in force distribution:', error);
    return NextResponse.json(
      { error: 'Failed to force distribution: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 