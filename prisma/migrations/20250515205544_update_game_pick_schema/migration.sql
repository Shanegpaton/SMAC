/*
  Warnings:

  - You are about to drop the column `authorId` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `bet` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `betAmount` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `gameTime` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `odds` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `publishRequest` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `result` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `sport` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `yield` on the `GamePick` table. All the data in the column will be lost.
  - Added the required column `pick` to the `GamePick` table without a default value. This is not possible if the table is not empty.

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
    "userId" TEXT,
    CONSTRAINT "GamePick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GamePick" ("awayTeam", "gameDate", "homeTeam", "id", "reasoning", "title") SELECT "awayTeam", "gameDate", "homeTeam", "id", "reasoning", "title" FROM "GamePick";
DROP TABLE "GamePick";
ALTER TABLE "new_GamePick" RENAME TO "GamePick";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
