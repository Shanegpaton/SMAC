/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `GamePick` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "SMACArticle" (
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
    CONSTRAINT "SMACArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SMACPick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "sport" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "bet" TEXT NOT NULL,
    "odds" REAL NOT NULL,
    "smacCoins" INTEGER NOT NULL,
    "result" TEXT,
    "yield" REAL,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SMACPick_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishRequest" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GamePick_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GamePick" ("authorId", "awayTeam", "createdAt", "gameDate", "homeTeam", "id", "pick", "publishRequest", "published", "reasoning", "title", "updatedAt") SELECT "authorId", "awayTeam", "createdAt", "gameDate", "homeTeam", "id", "pick", "publishRequest", "published", "reasoning", "title", "updatedAt" FROM "GamePick";
DROP TABLE "GamePick";
ALTER TABLE "new_GamePick" RENAME TO "GamePick";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
