const { PrismaClient } = require('@prisma/client');

async function applyMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Applying database migration...');
    
    // Test the connection first
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Create the tables using raw SQL
    console.log('📋 Creating ArticleVote table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ArticleVote" (
        "id" TEXT NOT NULL,
        "vote" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "userId" TEXT NOT NULL,
        "articleId" TEXT NOT NULL,
        CONSTRAINT "ArticleVote_pkey" PRIMARY KEY ("id")
      );
    `;
    
    console.log('📋 Creating ArticleComment table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ArticleComment" (
        "id" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "userId" TEXT NOT NULL,
        "articleId" TEXT NOT NULL,
        CONSTRAINT "ArticleComment_pkey" PRIMARY KEY ("id")
      );
    `;
    
    console.log('🔍 Creating indexes...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ArticleVote_articleId_idx" ON "ArticleVote"("articleId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ArticleVote_userId_idx" ON "ArticleVote"("userId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ArticleComment_articleId_idx" ON "ArticleComment"("articleId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ArticleComment_userId_idx" ON "ArticleComment"("userId");`;
    
    console.log('🔒 Creating unique constraint...');
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "ArticleVote_userId_articleId_key" ON "ArticleVote"("userId", "articleId");`;
    
    console.log('🔗 Adding foreign key constraints...');
    
    // Add foreign key constraints (with error handling in case they already exist)
    try {
      await prisma.$executeRaw`ALTER TABLE "ArticleVote" ADD CONSTRAINT "ArticleVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;`;
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
      console.log('⚠️  Foreign key constraint already exists (ArticleVote -> User)');
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE "ArticleVote" ADD CONSTRAINT "ArticleVote_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "SMACArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;`;
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
      console.log('⚠️  Foreign key constraint already exists (ArticleVote -> SMACArticle)');
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE "ArticleComment" ADD CONSTRAINT "ArticleComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;`;
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
      console.log('⚠️  Foreign key constraint already exists (ArticleComment -> User)');
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE "ArticleComment" ADD CONSTRAINT "ArticleComment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "SMACArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;`;
    } catch (e) {
      if (!e.message.includes('already exists')) throw e;
      console.log('⚠️  Foreign key constraint already exists (ArticleComment -> SMACArticle)');
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('🎉 Voting and commenting system is now ready to use!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
applyMigration();
