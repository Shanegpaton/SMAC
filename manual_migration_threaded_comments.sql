-- Migration to add threaded comments support
-- Add parentId column to ArticleComment table
ALTER TABLE "ArticleComment" ADD COLUMN "parentId" TEXT;

-- Add foreign key constraint for parent-child relationship
ALTER TABLE "ArticleComment" ADD CONSTRAINT "ArticleComment_parentId_fkey" 
FOREIGN KEY ("parentId") REFERENCES "ArticleComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX "ArticleComment_parentId_idx" ON "ArticleComment"("parentId");

-- Note: This migration adds support for threaded comments where:
-- - parentId is NULL for top-level comments
-- - parentId references another comment's ID for replies
-- - Replies are displayed nested under their parent comments
