import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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
        { error: 'You must be an admin to view distribution settings' },
        { status: 401 }
      );
    }

    // Get the current distribution settings
    let settings = await prisma.sMACCoinsDistribution.findFirst();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.sMACCoinsDistribution.create({
        data: {
          isActive: false,
          weeklyAmount: 100,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching distribution settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch distribution settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
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
        { error: 'You must be an admin to update distribution settings' },
        { status: 401 }
      );
    }

    const { isActive, weeklyAmount } = await request.json();

    if (typeof isActive !== 'boolean' || typeof weeklyAmount !== 'number' || weeklyAmount < 0) {
      return NextResponse.json(
        { error: 'Invalid settings. isActive must be boolean and weeklyAmount must be a non-negative number' },
        { status: 400 }
      );
    }

    // Get or create settings
    let settings = await prisma.sMACCoinsDistribution.findFirst();
    
    if (!settings) {
      settings = await prisma.sMACCoinsDistribution.create({
        data: {
          isActive,
          weeklyAmount,
        },
      });
    } else {
      settings = await prisma.sMACCoinsDistribution.update({
        where: { id: settings.id },
        data: {
          isActive,
          weeklyAmount,
        },
      });
    }

    // If distribution is being activated, distribute coins immediately
    if (isActive && (!settings.lastDistributed || 
        new Date().getTime() - settings.lastDistributed.getTime() > 7 * 24 * 60 * 60 * 1000)) {
      await distributeCoins(weeklyAmount);
      settings = await prisma.sMACCoinsDistribution.update({
        where: { id: settings.id },
        data: {
          lastDistributed: new Date(),
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating distribution settings:', error);
    return NextResponse.json(
      { error: 'Failed to update distribution settings' },
      { status: 500 }
    );
  }
}

async function distributeCoins(amount: number) {
  try {
    // Get all users
    const users = await prisma.user.findMany();
    
    // Update each user's SMAC coins balance
    await prisma.$transaction(
      users.map(user => 
        prisma.user.update({
          where: { id: user.id },
          data: {
            smacCoins: {
              increment: amount
            }
          }
        })
      )
    );

    console.log(`Distributed ${amount} SMAC coins to ${users.length} users`);
  } catch (error) {
    console.error('Error distributing coins:', error);
    throw error;
  }
} 