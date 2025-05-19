/*
  Warnings:

  - Added the required column `weekNumber` to the `UserSMACPick` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `UserSMACPick` table without a default value. This is not possible if the table is not empty.

*/
-- First, add the columns as nullable
ALTER TABLE "UserSMACPick" ADD COLUMN "weekNumber" INTEGER;
ALTER TABLE "UserSMACPick" ADD COLUMN "year" INTEGER;

-- Update existing records with values based on the date field
UPDATE "UserSMACPick"
SET 
  "year" = CAST(strftime('%Y', "date") AS INTEGER),
  "weekNumber" = CAST(
    (strftime('%j', "date") + 
    CAST(strftime('%w', strftime('%Y', "date") || '-01-01') AS INTEGER)) / 7 AS INTEGER
  );

-- Make the columns required by creating a new table with NOT NULL constraints
CREATE TABLE "new_UserSMACPick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "sport" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "bet" TEXT NOT NULL,
    "odds" REAL NOT NULL,
    "smacCoins" INTEGER NOT NULL,
    "result" TEXT,
    "yield" REAL,
    "weekNumber" INTEGER NOT NULL DEFAULT 1,
    "year" INTEGER NOT NULL DEFAULT 2024,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserSMACPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Copy data from old table to new table
INSERT INTO "new_UserSMACPick" ("id", "date", "sport", "game", "bet", "odds", "smacCoins", "result", "yield", "weekNumber", "year", "createdAt", "updatedAt", "userId")
SELECT 
    "id", 
    "date", 
    "sport", 
    "game", 
    "bet", 
    "odds", 
    "smacCoins", 
    "result", 
    "yield", 
    COALESCE("weekNumber", 1), 
    COALESCE("year", 2024), 
    "createdAt", 
    "updatedAt", 
    "userId"
FROM "UserSMACPick";

-- Drop old table and rename new table
DROP TABLE "UserSMACPick";
ALTER TABLE "new_UserSMACPick" RENAME TO "UserSMACPick";

-- Recreate indexes
CREATE INDEX "UserSMACPick_userId_idx" ON "UserSMACPick"("userId");
CREATE INDEX "UserSMACPick_year_weekNumber_idx" ON "UserSMACPick"("year", "weekNumber");
