import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('=== Checking Distribution ===');
    
    // Get distribution settings
    const distribution = await prisma.SMACCoinsDistribution.findFirst();
    console.log('Distribution settings:', distribution);

    if (!distribution?.isActive) {
      console.log('Distribution is not active');
      return NextResponse.json({ message: 'Distribution is not active' });
    }

    // Check if enough time has passed (1 minute for testing)
    const now = new Date();
    const lastDistributed = distribution.lastDistributed;
    const timeSinceLastDistribution = now.getTime() - lastDistributed.getTime();
    const oneMinute = 60 * 1000; // 1 minute in milliseconds

    if (timeSinceLastDistribution < oneMinute) {
      console.log('Not enough time has passed since last distribution');
      return NextResponse.json({
        message: 'Not enough time has passed',
        nextDistribution: new Date(lastDistributed.getTime() + oneMinute)
      });
    }

    // Get all users
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

    // Update each user's SMAC coins
    const updatePromises = users.map(async user => {
      console.log(`Updating user ${user.email}...`);
      const updatedUser = await prisma.user.update({
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
    });

    await Promise.all(updatePromises);

    // Update last distributed timestamp
    const updatedDistribution = await prisma.SMACCoinsDistribution.update({
      where: { id: distribution.id },
      data: {
        lastDistributed: now
      }
    });

    console.log('Distribution complete');
    return NextResponse.json({
      message: 'Distribution successful',
      usersUpdated: users.length,
      nextDistribution: new Date(now.getTime() + oneMinute)
    });
  } catch (error) {
    console.error('Error checking distribution:', error);
    return NextResponse.json(
      { error: 'Failed to check distribution' },
      { status: 500 }
    );
  }
} 