import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('=== Getting Distribution Settings ===');
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
        { error: 'You must be an admin to access distribution settings' },
        { status: 401 }
      );
    }

    // Get distribution settings
    const distribution = await prisma.SMACCoinsDistribution.findFirst();
    console.log('Distribution settings:', distribution);

    return NextResponse.json(distribution || {
      isActive: false,
      weeklyAmount: 0,
      lastDistributed: null
    });
  } catch (error) {
    console.error('Error getting distribution settings:', error);
    return NextResponse.json(
      { error: 'Failed to get distribution settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('=== Updating Distribution Settings ===');
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
        { error: 'You must be an admin to update distribution settings' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);

    const { isActive, weeklyAmount } = body;

    if (typeof isActive !== 'boolean' || typeof weeklyAmount !== 'number') {
      console.log('Invalid input:', { isActive, weeklyAmount });
      return NextResponse.json(
        { error: 'Invalid input. isActive must be boolean and weeklyAmount must be a number' },
        { status: 400 }
      );
    }

    // Get current distribution settings
    const currentDistribution = await prisma.SMACCoinsDistribution.findFirst();
    console.log('Current distribution settings:', currentDistribution);

    // Update distribution settings and distribute coins if being activated
    const result = await prisma.$transaction(async (tx) => {
      let distribution;
      
      if (currentDistribution) {
        // Update existing distribution
        distribution = await tx.SMACCoinsDistribution.update({
          where: { id: currentDistribution.id },
          data: {
            isActive,
            weeklyAmount,
            // If turning on distribution, set lastDistributed to now
            ...(isActive && !currentDistribution.isActive ? { lastDistributed: new Date() } : {})
          }
        });
      } else {
        // Create new distribution
        distribution = await tx.SMACCoinsDistribution.create({
          data: {
            isActive,
            weeklyAmount,
            // If active, set lastDistributed to now
            ...(isActive ? { lastDistributed: new Date() } : {})
          }
        });
      }

      // If distribution is being activated, distribute coins immediately
      if (isActive && (!currentDistribution?.isActive || !currentDistribution?.lastDistributed)) {
        console.log('Distributing coins immediately...');
        
        // Get all users
        const users = await tx.user.findMany({
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
          const updatedUser = await tx.user.update({
            where: { id: user.id },
            data: {
              smacCoins: {
                increment: weeklyAmount
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
            added: weeklyAmount
          });
          return updatedUser;
        });

        await Promise.all(updatePromises);
        console.log('Initial distribution complete');
      }

      return distribution;
    });

    console.log('Updated distribution settings:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating distribution settings:', error);
    return NextResponse.json(
      { error: 'Failed to update distribution settings' },
      { status: 500 }
    );
  }
} 