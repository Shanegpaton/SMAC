-- CreateTable
CREATE TABLE "SMACCoinsDistribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "weeklyAmount" INTEGER NOT NULL,
    "lastDistributed" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
