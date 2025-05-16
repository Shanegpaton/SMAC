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
INSERT INTO "new_GamePick" ("authorId", "awayTeam", "bet", "betAmount", "createdAt", "gameDate", "gameTime", "homeTeam", "id", "odds", "result", "sport", "updatedAt", "yield") SELECT "authorId", "awayTeam", "bet", "betAmount", "createdAt", "gameDate", "gameTime", "homeTeam", "id", "odds", "result", "sport", "updatedAt", "yield" FROM "GamePick";
DROP TABLE "GamePick";
ALTER TABLE "new_GamePick" RENAME TO "GamePick";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
