import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Verify the request is from a cron job
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the distribution settings
    const settings = await prisma.sMACCoinsDistribution.findFirst();
    
    if (!settings || !settings.isActive) {
      return NextResponse.json({ message: 'Distribution is not active' });
    }

    // Check if it's been a week since the last distribution
    if (settings.lastDistributed) {
      const lastDistributed = new Date(settings.lastDistributed);
      const now = new Date();
      const diffInDays = (now.getTime() - lastDistributed.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffInDays < 7) {
        return NextResponse.json({ message: 'Not time for distribution yet' });
      }
    }

    // Get all users
    const users = await prisma.user.findMany();
    
    // Update each user's SMAC coins balance
    await prisma.$transaction(
      users.map(user => 
        prisma.user.update({
          where: { id: user.id },
          data: {
            smacCoins: {
              increment: settings.weeklyAmount
            }
          }
        })
      )
    );

    // Update the last distributed timestamp
    await prisma.sMACCoinsDistribution.update({
      where: { id: settings.id },
      data: {
        lastDistributed: new Date()
      }
    });

    return NextResponse.json({
      message: `Successfully distributed ${settings.weeklyAmount} SMAC coins to ${users.length} users`
    });
  } catch (error) {
    console.error('Error in distribute-smac-coins cron job:', error);
    return NextResponse.json(
      { error: 'Failed to distribute SMAC coins' },
      { status: 500 }
    );
  }
} 