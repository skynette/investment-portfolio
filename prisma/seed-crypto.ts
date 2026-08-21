import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { parseTransactionsCsv } from "../src/server/lib/csv-parser";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const KNOWN_NAMES: Record<string, string> = {
  SOL: "Solana", JUP: "Jupiter", WEN: "Wen", GRASS: "Grass",
  ARKM: "Arkham", XRP: "XRP",
};

async function main() {
  // Override with CRYPTO_CSV env var, otherwise use ./data/transactions.csv (gitignored).
  const csvPath = process.env.CRYPTO_CSV
    ? path.resolve(process.env.CRYPTO_CSV)
    : path.resolve(__dirname, "..", "data", "transactions.csv");

  if (!fs.existsSync(csvPath)) {
    console.log(`No CSV at ${csvPath}; skipping crypto seed.`);
    console.log(`Set CRYPTO_CSV=/path/to/your.csv or place a file at data/transactions.csv`);
    return;
  }
  const csv = fs.readFileSync(csvPath, "utf8");
  const parsed = parseTransactionsCsv(csv);
  console.log(`Parsed ${parsed.length} transactions from CSV.`);

  let inserted = 0;
  let skipped = 0;
  for (const row of parsed) {
    const symbol = row.symbol.toUpperCase();
    const asset = await prisma.cryptoAsset.upsert({
      where: { symbol },
      update: { name: KNOWN_NAMES[symbol] ?? symbol, cmcSymbol: symbol },
      create: { symbol, name: KNOWN_NAMES[symbol] ?? symbol, cmcSymbol: symbol },
    });
    try {
      await prisma.cryptoTransaction.create({
        data: {
          assetId: asset.id,
          occurredAt: row.occurredAt,
          type: row.type,
          pricePerUnit: row.pricePerUnit,
          amount: row.amount,
          totalUsd: row.totalUsd,
          fee: row.fee,
          feeCurrency: row.feeCurrency,
          note: row.note,
        },
      });
      inserted++;
    } catch {
      skipped++;
    }
  }
  console.log(`Crypto seed: inserted ${inserted}, skipped ${skipped} (duplicates).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
