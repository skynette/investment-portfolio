import "dotenv/config";
import Database from "better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

type SqliteCategory = {
  id: number;
  name: string;
  currency: string;
  defaultMonthlyTarget: number | string;
  isActive: number;
  createdAt: string;
};

type SqliteMonthlyEntry = {
  id: number;
  categoryId: number;
  year: number;
  month: number;
  target: number | string;
  actual: number | string;
  note: string | null;
  updatedAt: string;
};

type SqliteCryptoAsset = {
  id: number;
  symbol: string;
  name: string;
  cmcSymbol: string;
  isActive: number;
};

type SqliteCryptoTransaction = {
  id: number;
  assetId: number;
  occurredAt: string;
  type: string;
  pricePerUnit: number | string | null;
  amount: number | string;
  totalUsd: number | string | null;
  fee: number | string | null;
  feeCurrency: string | null;
  note: string | null;
};

type SqliteFxRate = {
  id: number;
  base: string;
  quote: string;
  rate: number | string;
  fetchedAt: string;
};

type SqliteSetting = {
  key: string;
  value: string;
};

function sqlitePath() {
  const url = process.env.SQLITE_DATABASE_URL ?? "file:./portfolio.db";
  return url.startsWith("file:") ? url.slice("file:".length) : url;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const sqlite = new Database(sqlitePath(), { readonly: true });
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: ["error", "warn"],
  });

  const categories = sqlite.prepare('SELECT * FROM "Category" ORDER BY id').all() as SqliteCategory[];
  const monthlyEntries = sqlite.prepare('SELECT * FROM "MonthlyEntry" ORDER BY id').all() as SqliteMonthlyEntry[];
  const cryptoAssets = sqlite.prepare('SELECT * FROM "CryptoAsset" ORDER BY id').all() as SqliteCryptoAsset[];
  const cryptoTransactions = sqlite.prepare('SELECT * FROM "CryptoTransaction" ORDER BY id').all() as SqliteCryptoTransaction[];
  const fxRates = sqlite.prepare('SELECT * FROM "FxRate" ORDER BY id').all() as SqliteFxRate[];
  const settings = sqlite.prepare('SELECT * FROM "Setting" ORDER BY key').all() as SqliteSetting[];

  console.log(
    JSON.stringify({
      categories: categories.length,
      monthlyEntries: monthlyEntries.length,
      cryptoAssets: cryptoAssets.length,
      cryptoTransactions: cryptoTransactions.length,
      fxRates: fxRates.length,
      settings: settings.length,
    }),
  );

  await prisma.$transaction(async (tx) => {
    await tx.cryptoTransaction.deleteMany();
    await tx.monthlyEntry.deleteMany();
    await tx.fxRate.deleteMany();
    await tx.cryptoAsset.deleteMany();
    await tx.category.deleteMany();
    await tx.setting.deleteMany();

    if (categories.length > 0) {
      await tx.category.createMany({
        data: categories.map((row) => ({
          id: row.id,
          name: row.name,
          currency: row.currency,
          defaultMonthlyTarget: String(row.defaultMonthlyTarget),
          isActive: Boolean(row.isActive),
          createdAt: new Date(row.createdAt),
        })),
      });
    }

    if (cryptoAssets.length > 0) {
      await tx.cryptoAsset.createMany({
        data: cryptoAssets.map((row) => ({
          id: row.id,
          symbol: row.symbol,
          name: row.name,
          cmcSymbol: row.cmcSymbol,
          isActive: Boolean(row.isActive),
        })),
      });
    }

    if (monthlyEntries.length > 0) {
      await tx.monthlyEntry.createMany({
        data: monthlyEntries.map((row) => ({
          id: row.id,
          categoryId: row.categoryId,
          year: row.year,
          month: row.month,
          target: String(row.target),
          actual: String(row.actual),
          note: row.note,
          updatedAt: new Date(row.updatedAt),
        })),
      });
    }

    if (cryptoTransactions.length > 0) {
      await tx.cryptoTransaction.createMany({
        data: cryptoTransactions.map((row) => ({
          id: row.id,
          assetId: row.assetId,
          occurredAt: new Date(row.occurredAt),
          type: row.type,
          pricePerUnit: row.pricePerUnit === null ? null : String(row.pricePerUnit),
          amount: String(row.amount),
          totalUsd: row.totalUsd === null ? null : String(row.totalUsd),
          fee: row.fee === null ? null : String(row.fee),
          feeCurrency: row.feeCurrency,
          note: row.note,
        })),
      });
    }

    if (fxRates.length > 0) {
      await tx.fxRate.createMany({
        data: fxRates.map((row) => ({
          id: row.id,
          base: row.base,
          quote: row.quote,
          rate: String(row.rate),
          fetchedAt: new Date(row.fetchedAt),
        })),
      });
    }

    if (settings.length > 0) {
      await tx.setting.createMany({ data: settings });
    }
  });

  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"Category"', 'id'),
      COALESCE((SELECT MAX(id) FROM "Category"), 1),
      (SELECT COUNT(*) > 0 FROM "Category")
    );
  `);
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"MonthlyEntry"', 'id'),
      COALESCE((SELECT MAX(id) FROM "MonthlyEntry"), 1),
      (SELECT COUNT(*) > 0 FROM "MonthlyEntry")
    );
  `);
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"CryptoAsset"', 'id'),
      COALESCE((SELECT MAX(id) FROM "CryptoAsset"), 1),
      (SELECT COUNT(*) > 0 FROM "CryptoAsset")
    );
  `);
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"CryptoTransaction"', 'id'),
      COALESCE((SELECT MAX(id) FROM "CryptoTransaction"), 1),
      (SELECT COUNT(*) > 0 FROM "CryptoTransaction")
    );
  `);
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"FxRate"', 'id'),
      COALESCE((SELECT MAX(id) FROM "FxRate"), 1),
      (SELECT COUNT(*) > 0 FROM "FxRate")
    );
  `);

  await prisma.$disconnect();
  sqlite.close();
  console.log("SQLite data imported into Postgres.");
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
