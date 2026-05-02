"use server";

import { prisma } from "@/server/lib/db";
import { revalidatePath } from "next/cache";
import { parseTransactionsCsv } from "@/server/lib/csv-parser";
import { upsertAsset } from "./assets";

const KNOWN_NAMES: Record<string, string> = {
  SOL: "Solana", JUP: "Jupiter", WEN: "Wen", GRASS: "Grass",
  ARKM: "Arkham", XRP: "XRP",
};

export async function listTransactions(filter?: { assetId?: number }) {
  return prisma.cryptoTransaction.findMany({
    where: filter?.assetId ? { assetId: filter.assetId } : undefined,
    include: { asset: true },
    orderBy: { occurredAt: "desc" },
  });
}

export async function createTransaction(input: {
  assetId: number;
  occurredAt: Date;
  type: "buy" | "sell" | "transferIn" | "transferOut";
  pricePerUnit: number | null;
  amount: number;
  totalUsd: number | null;
  fee: number | null;
  feeCurrency: string | null;
  note: string | null;
}) {
  const created = await prisma.cryptoTransaction.create({ data: input });
  revalidatePath("/crypto");
  revalidatePath("/");
  return created;
}

export async function updateTransaction(id: number, input: {
  occurredAt?: Date;
  type?: "buy" | "sell" | "transferIn" | "transferOut";
  pricePerUnit?: number | null;
  amount?: number;
  totalUsd?: number | null;
  fee?: number | null;
  feeCurrency?: string | null;
  note?: string | null;
}) {
  const updated = await prisma.cryptoTransaction.update({ where: { id }, data: input });
  revalidatePath("/crypto");
  revalidatePath("/");
  return updated;
}

export async function deleteTransaction(id: number) {
  await prisma.cryptoTransaction.delete({ where: { id } });
  revalidatePath("/crypto");
  revalidatePath("/");
}

export async function importTransactionsCsv(csv: string) {
  const parsed = parseTransactionsCsv(csv);
  let inserted = 0;
  let skipped = 0;

  for (const row of parsed) {
    const asset = await upsertAsset({
      symbol: row.symbol,
      name: KNOWN_NAMES[row.symbol] ?? row.symbol,
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

  revalidatePath("/crypto");
  revalidatePath("/");
  return { inserted, skipped, totalParsed: parsed.length };
}
