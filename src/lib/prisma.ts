import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
}

// Use different connection strategies for dev vs production
const isProduction = process.env.NODE_ENV === 'production';

let prisma: PrismaClient;

try {
  prisma = globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Optimize for serverless environments
    log: isProduction ? ['error'] : ['error', 'warn'],
  })
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  // Create a fallback client with minimal configuration
  prisma = new PrismaClient({
    log: ['error'],
  });
}

if (!isProduction) {
  globalForPrisma.prisma = prisma
}

// Handle connection cleanup for serverless
if (isProduction) {
  // In production, disconnect after each request
  process.on('beforeExit', async () => {
    try {
      await prisma.$disconnect()
    } catch (error) {
      console.error('Error disconnecting Prisma client:', error);
    }
  })
}

export { prisma }; 