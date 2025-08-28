import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
}

// Use different connection strategies for dev vs production
const isProduction = process.env.NODE_ENV === 'production';
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL;

// Track connection attempts to prevent infinite loops
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

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
    // Add connection management for serverless
    ...(isProduction && {
      // Disable connection pooling for serverless
      __internal: {
        engine: {
          enableEngineDebugMode: false,
        },
      },
    }),
  })
  
  // Test the connection immediately to catch any issues
  if (isProduction && connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
    try {
      connectionAttempts++;
      await prisma.$connect();
      console.log('Prisma client connected successfully');
      connectionAttempts = 0; // Reset on success
    } catch (connectionError) {
      console.error(`Failed to connect to database (attempt ${connectionAttempts}):`, connectionError);
      // If connection fails, try to disconnect and reconnect
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        console.error('Failed to disconnect:', disconnectError);
      }
      
      // If we've tried too many times, just continue with the client
      if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
        console.warn('Max connection attempts reached, continuing with client');
        connectionAttempts = 0;
      } else {
        throw connectionError;
      }
    }
  }
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
  
  // Also handle SIGTERM for serverless environments
  process.on('SIGTERM', async () => {
    try {
      await prisma.$disconnect()
    } catch (error) {
      console.error('Error disconnecting Prisma client on SIGTERM:', error);
    }
  })
}

export { prisma }; 