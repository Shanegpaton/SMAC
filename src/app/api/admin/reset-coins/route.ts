import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('=== Starting Coin Reset ===');
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
        { error: 'You must be an admin to reset coin balances' },
        { status: 401 }
      );
    }

    // Get the new balance from the request
    const { newBalance } = await request.json();
    console.log('Requested new balance:', newBalance);

    if (typeof newBalance !== 'number' || newBalance < 0) {
      return NextResponse.json(
        { error: 'Invalid balance. Must be a non-negative number' },
        { status: 400 }
      );
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

    // Reset all users' SMAC coins in a transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log('Inside transaction - resetting balances...');
      
      // Update each user's SMAC coins
      const updatePromises = users.map(async user => {
        console.log(`Resetting balance for user ${user.email}...`);
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            smacCoins: newBalance
          },
          select: {
            id: true,
            email: true,
            smacCoins: true
          }
        });
        console.log(`Reset user ${user.email}:`, {
          oldBalance: user.smacCoins,
          newBalance: updatedUser.smacCoins
        });
        return updatedUser;
      });

      // Wait for all updates to complete
      const updatedUsers = await Promise.all(updatePromises);
      console.log('Transaction completed successfully');

      return { updatedUsers };
    });

    // Verify the updates
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

    console.log('=== Coin Reset Complete ===');

    return NextResponse.json({
      success: true,
      message: `Reset SMAC coins to ${newBalance} for ${users.length} users`,
      users: verifiedUsers.map(u => ({
        email: u.email,
        newBalance: u.smacCoins
      }))
    });
  } catch (error) {
    console.error('Error in reset coins:', error);
    return NextResponse.json(
      { error: 'Failed to reset coin balances' },
      { status: 500 }
    );
  }
} 