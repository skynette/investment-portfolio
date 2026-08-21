/**
 * Reconcile a CoinMarketCap portfolio export against the database.
 *
 *   npx tsx prisma/reconcile-cmc.ts <path-to-transactions.csv>            # dry run
 *   npx tsx prisma/reconcile-cmc.ts <path-to-transactions.csv> --apply    # write
 *
 * Why this exists instead of a plain CSV import:
 *
 * CMC records the *trade* time, while rows entered by hand through the app carry
 * the time they were entered. The same trade therefore appears with different
 * timestamps on each side, so matching on `occurredAt` — which is what the
 * `tx_dedupe` unique constraint does — reports already-known trades as new and
 * silently doubles your holdings.
 *
 * So a trade is identified here by (symbol, type, amount, totalUsd) with the
 * nearest match inside a 3-day window, claimed one-to-one so repeated identical
 * buys can't collapse onto a single row. Existing rows are never modified;
 * timestamp drift on matched rows is reported and left alone.
 *
 * Transactions older than `CUTOFF` in `src/server/lib/csv-parser.ts` are skipped,
 * and symbols with no `CryptoAsset` row are reported rather than auto-created.
 */
import "dotenv/config";
import * as fs from "node:fs";
import { parseTransactionsCsv, type ParsedTx } from "../src/server/lib/csv-parser";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const MATCH_WINDOW_MS = 3 * 86_400_000;
const AMOUNT_TOLERANCE = 1e-8;
const USD_TOLERANCE = 0.01;

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const near = (a: number | null, b: number | null, tol: number) =>
  a === null && b === null ? true : a === null || b === null ? false : Math.abs(a - b) <= tol;
const stamp = (d: Date) => d.toISOString().replace("T", " ").slice(0, 16);

async function main() {
  const csvPath = process.argv[2];
  const apply = process.argv.includes("--apply");
  if (!csvPath) {
    console.error("usage: tsx prisma/reconcile-cmc.ts <transactions.csv> [--apply]");
    process.exit(1);
  }

  const parsed = parseTransactionsCsv(fs.readFileSync(csvPath, "utf8"));
  const assets = await prisma.cryptoAsset.findMany();
  const bySymbol = new Map(assets.map((a) => [a.symbol, a]));
  const db = await prisma.cryptoTransaction.findMany({ include: { asset: true } });

  const claimed = new Set<number>();
  const drifted: { tx: ParsedTx; was: Date }[] = [];
  const fresh: ParsedTx[] = [];

  for (const tx of parsed) {
    const best = db
      .filter(
        (r) =>
          !claimed.has(r.id) &&
          r.asset.symbol === tx.symbol &&
          r.type === tx.type &&
          near(num(r.amount), tx.amount, AMOUNT_TOLERANCE) &&
          near(num(r.totalUsd), tx.totalUsd, USD_TOLERANCE),
      )
      .map((r) => ({ row: r, drift: Math.abs(r.occurredAt.getTime() - tx.occurredAt.getTime()) }))
      .filter((c) => c.drift <= MATCH_WINDOW_MS)
      .sort((a, b) => a.drift - b.drift)[0];

    if (!best) {
      fresh.push(tx);
      continue;
    }
    claimed.add(best.row.id);
    if (best.drift > 60_000) drifted.push({ tx, was: best.row.occurredAt });
  }

  const orphans = db.filter((r) => !claimed.has(r.id));
  const unknown = fresh.filter((t) => !bySymbol.has(t.symbol));

  console.log(`CSV (post-cutoff): ${parsed.length}   DB: ${db.length}   matched: ${claimed.size}`);
  console.log(`\nnew transactions: ${fresh.length}`);
  for (const t of fresh) {
    console.log(`  + ${stamp(t.occurredAt)}  ${t.symbol.padEnd(6)} ${t.type.padEnd(11)} ${t.amount} ($${t.totalUsd})`);
  }
  if (orphans.length) {
    console.log(`\nin DB but not in the export (left untouched): ${orphans.length}`);
    for (const r of orphans) {
      console.log(`  ? ${stamp(r.occurredAt)}  ${r.asset.symbol.padEnd(6)} ${r.type.padEnd(11)} ${r.amount}`);
    }
  }
  if (drifted.length) {
    console.log(`\nmatched but timestamps differ (left untouched): ${drifted.length}`);
  }
  if (unknown.length) {
    console.log(`\nno CryptoAsset row for: ${[...new Set(unknown.map((t) => t.symbol))].join(", ")} — add them first`);
  }

  if (!apply) {
    console.log("\ndry run — pass --apply to write");
    await prisma.$disconnect();
    return;
  }

  let inserted = 0;
  for (const tx of fresh) {
    const asset = bySymbol.get(tx.symbol);
    if (!asset) continue;
    await prisma.cryptoTransaction.create({
      data: {
        assetId: asset.id,
        occurredAt: tx.occurredAt,
        type: tx.type,
        pricePerUnit: tx.pricePerUnit,
        amount: tx.amount,
        totalUsd: tx.totalUsd,
        fee: tx.fee,
        feeCurrency: tx.feeCurrency,
        note: tx.note,
      },
    });
    inserted++;
  }
  console.log(`\ninserted ${inserted}${unknown.length ? `, skipped ${unknown.length} with unknown assets` : ""}`);
  await prisma.$disconnect();
}

main();
