import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all users who have made picks
    const users = await prisma.user.findMany({
      where: {
        userSMACPicks: {
          some: {} // Has at least one pick
        }
      },
      include: {
        userSMACPicks: {
          select: {
            id: true,
            result: true,
            odds: true,
            smacCoins: true,
            sport: true,
            yield: true
          }
        }
      }
    });

    // Calculate statistics for each user
    const traders = users.map(user => {
      const picks = user.userSMACPicks;
      
      // Debug logging for raw picks data
      console.log('Raw picks for user:', user.name, picks.map(pick => ({
        id: pick.id,
        result: pick.result,
        odds: pick.odds,
        smacCoins: pick.smacCoins
      })));

      const totalPicks = picks.length;
      const wins = picks.filter(pick => pick.result === 'win').length;
      const losses = picks.filter(pick => pick.result === 'loss').length;
      const pending = picks.filter(pick => !pick.result).length;
      
      // Calculate total yield
      const totalStaked = picks.reduce((sum, pick) => sum + (pick.smacCoins || 0), 0);
      const weightedYield = picks.reduce((sum, pick) => {
        if (!pick.result || !pick.smacCoins) return sum;
        const weight = pick.smacCoins / totalStaked;
        return sum + (pick.yield * weight);
      }, 0);

      // Get unique sports they've bet on
      const sports = [...new Set(picks.map(pick => pick.sport))];

      // Calculate win rate only for completed picks (wins + losses)
      const completedPicks = wins + losses;
      const winRate = completedPicks > 0 ? ((wins / completedPicks) * 100).toFixed(1) : '0.0';

      console.log('Trader stats:', {
        name: user.name,
        totalPicks,
        wins,
        losses,
        pending,
        winRate,
        completedPicks,
        picksWithResults: picks.filter(pick => pick.result).length,
        picksWithWins: picks.filter(pick => pick.result === 'win').length,
        picksWithLosses: picks.filter(pick => pick.result === 'loss').length
      });

      return {
        id: user.id,
        name: user.name || 'Anonymous Trader',
        smacCoins: user.smacCoins,
        totalPicks,
        wins,
        losses,
        pending,
        winRate,
        totalYield: Number(weightedYield.toFixed(2)),
        sports
      };
    });

    // Sort traders by SMAC coins balance (descending)
    traders.sort((a, b) => b.smacCoins - a.smacCoins);

    return NextResponse.json(traders);
  } catch (error) {
    console.error('Error fetching traders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch traders' },
      { status: 500 }
    );
  }
} 