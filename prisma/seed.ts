/**
 * Default seed: creates three example NGN categories with sensible monthly targets.
 * Does NOT pre-populate any monthly entries — those are auto-created when you
 * first open a month in the app, using the category default targets.
 *
 * Customize this file to match your own categories and currencies before running:
 *
 *   npx tsx prisma/seed.ts
 *
 * If you want a personal seed with your own historical data, copy this file to
 * `prisma/seed.personal.ts` (gitignored) and edit there.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = [
    { name: "US Stocks", currency: "NGN", defaultMonthlyTarget: 150000 },
    { name: "Local Equities", currency: "NGN", defaultMonthlyTarget: 100000 },
    { name: "Mutual Funds", currency: "NGN", defaultMonthlyTarget: 150000 },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }

  console.log(`Seed complete: ${categories.length} categories created with default targets.`);
  console.log("Open the app and the current month's rows will auto-roll from these defaults.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
