import { NextResponse } from 'next/server';
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
    console.log('Global SMAC Coins API: Starting request');
    
    // Add connection timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 15000);
    });

    // Global SMAC coins should be visible to everyone (no authentication required)
    const globalSMACCoinsPromise = getOrCreateGlobalSMACCoins();
    
    // Race between timeout and database query
    const globalSMACCoins = await Promise.race([globalSMACCoinsPromise, timeoutPromise]) as any;
    
    console.log('Global SMAC Coins API: Successfully fetched data');
    return NextResponse.json(globalSMACCoins);
  } catch (error) {
    console.error('Error fetching global SMAC coins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global SMAC coins', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 