/*
  Warnings:

  - You are about to drop the column `userId` on the `GamePick` table. All the data in the column will be lost.
  - Added the required column `authorId` to the `GamePick` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `GamePick` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GamePick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "gameDate" DATETIME NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "pick" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "imageUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishRequest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "GamePick_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GamePick" ("awayTeam", "gameDate", "homeTeam", "id", "pick", "reasoning", "title") SELECT "awayTeam", "gameDate", "homeTeam", "id", "pick", "reasoning", "title" FROM "GamePick";
DROP TABLE "GamePick";
ALTER TABLE "new_GamePick" RENAME TO "GamePick";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
