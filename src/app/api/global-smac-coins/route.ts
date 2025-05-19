import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Helper function to get or create global SMAC coins record
async function getOrCreateGlobalSMACCoins() {
  let globalSMACCoins = await prisma.globalSMACCoins.findFirst();
  if (!globalSMACCoins) {
    globalSMACCoins = await prisma.globalSMACCoins.create({
      data: {
        balance: 1000, // Default starting balance
      },
    });
  }
  return globalSMACCoins;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const globalSMACCoins = await getOrCreateGlobalSMACCoins();
    return NextResponse.json(globalSMACCoins);
  } catch (error) {
    console.error('Error fetching global SMAC coins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global SMAC coins' },
      { status: 500 }
    );
  }
} 