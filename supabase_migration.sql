-- Create ArticleVote table
CREATE TABLE "ArticleVote" (
    "id" TEXT NOT NULL,
    "vote" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "ArticleVote_pkey" PRIMARY KEY ("id")
);

-- Create ArticleComment table
CREATE TABLE "ArticleComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "ArticleComment_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE INDEX "ArticleVote_articleId_idx" ON "ArticleVote"("articleId");
CREATE INDEX "ArticleVote_userId_idx" ON "ArticleVote"("userId");
CREATE INDEX "ArticleComment_articleId_idx" ON "ArticleComment"("articleId");
CREATE INDEX "ArticleComment_userId_idx" ON "ArticleComment"("userId");

-- Create unique constraint for one vote per user per article
CREATE UNIQUE INDEX "ArticleVote_userId_articleId_key" ON "ArticleVote"("userId", "articleId");

-- Add foreign key constraints
ALTER TABLE "ArticleVote" ADD CONSTRAINT "ArticleVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleVote" ADD CONSTRAINT "ArticleVote_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "SMACArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArticleComment" ADD CONSTRAINT "ArticleComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleComment" ADD CONSTRAINT "ArticleComment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "SMACArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
