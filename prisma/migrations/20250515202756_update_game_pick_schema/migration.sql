/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `pick` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `publishRequest` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `reasoning` on the `GamePick` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `GamePick` table. All the data in the column will be lost.
  - Added the required column `bet` to the `GamePick` table without a default value. This is not possible if the table is not empty.
  - Added the required column `betAmount` to the `GamePick` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gameTime` to the `GamePick` table without a default value. This is not possible if the table is not empty.
  - Added the required column `odds` to the `GamePick` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sport` to the `GamePick` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GamePick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sport" TEXT NOT NULL,
    "gameDate" DATETIME NOT NULL,
    "gameTime" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "bet" TEXT NOT NULL,
    "odds" REAL NOT NULL,
    "betAmount" REAL NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'P',
    "yield" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "GamePick_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GamePick" ("authorId", "awayTeam", "createdAt", "gameDate", "homeTeam", "id", "updatedAt") SELECT "authorId", "awayTeam", "createdAt", "gameDate", "homeTeam", "id", "updatedAt" FROM "GamePick";
DROP TABLE "GamePick";
ALTER TABLE "new_GamePick" RENAME TO "GamePick";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
