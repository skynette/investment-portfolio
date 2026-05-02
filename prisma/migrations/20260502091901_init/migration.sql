-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "defaultMonthlyTarget" DECIMAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MonthlyEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "target" DECIMAL NOT NULL DEFAULT 0,
    "actual" DECIMAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonthlyEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CryptoAsset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cmcSymbol" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "CryptoTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assetId" INTEGER NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "pricePerUnit" DECIMAL,
    "amount" DECIMAL NOT NULL,
    "totalUsd" DECIMAL,
    "fee" DECIMAL,
    "feeCurrency" TEXT,
    "note" TEXT,
    CONSTRAINT "CryptoTransaction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "CryptoAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FxRate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "base" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "rate" DECIMAL NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "MonthlyEntry_year_month_idx" ON "MonthlyEntry"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyEntry_categoryId_year_month_key" ON "MonthlyEntry"("categoryId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "CryptoAsset_symbol_key" ON "CryptoAsset"("symbol");

-- CreateIndex
CREATE INDEX "CryptoTransaction_assetId_occurredAt_idx" ON "CryptoTransaction"("assetId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "CryptoTransaction_assetId_occurredAt_type_amount_totalUsd_key" ON "CryptoTransaction"("assetId", "occurredAt", "type", "amount", "totalUsd");

-- CreateIndex
CREATE INDEX "FxRate_base_quote_fetchedAt_idx" ON "FxRate"("base", "quote", "fetchedAt");
