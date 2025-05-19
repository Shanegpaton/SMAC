-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "smacCoins" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "isAdmin", "name", "password", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "isAdmin", "name", "password", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
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
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserSMACPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserSMACPick" ("bet", "createdAt", "date", "game", "id", "odds", "result", "smacCoins", "sport", "updatedAt", "userId", "weekNumber", "year", "yield") SELECT "bet", "createdAt", "date", "game", "id", "odds", "result", "smacCoins", "sport", "updatedAt", "userId", "weekNumber", "year", "yield" FROM "UserSMACPick";
DROP TABLE "UserSMACPick";
ALTER TABLE "new_UserSMACPick" RENAME TO "UserSMACPick";
CREATE INDEX "UserSMACPick_userId_idx" ON "UserSMACPick"("userId");
CREATE INDEX "UserSMACPick_year_weekNumber_idx" ON "UserSMACPick"("year", "weekNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
