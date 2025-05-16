/*
  Warnings:

  - You are about to alter the column `smacCoins` on the `UserSMACPick` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserSMACPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserSMACPick" ("bet", "createdAt", "date", "game", "id", "odds", "result", "smacCoins", "sport", "updatedAt", "userId", "yield") SELECT "bet", "createdAt", "date", "game", "id", "odds", "result", "smacCoins", "sport", "updatedAt", "userId", "yield" FROM "UserSMACPick";
DROP TABLE "UserSMACPick";
ALTER TABLE "new_UserSMACPick" RENAME TO "UserSMACPick";
CREATE INDEX "UserSMACPick_userId_idx" ON "UserSMACPick"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SMACPick_authorId_idx" ON "SMACPick"("authorId");

-- CreateIndex
CREATE INDEX "SMACPick_year_weekNumber_idx" ON "SMACPick"("year", "weekNumber");
