"use server";

import { prisma } from "@/server/lib/db";

function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportMonthlyCsv(): Promise<string> {
  const rows = await prisma.monthlyEntry.findMany({
    include: { category: true },
    orderBy: [{ year: "asc" }, { month: "asc" }, { category: { name: "asc" } }],
  });
  const header = "Year,Month,Category,Currency,Target,Actual,Note";
  const body = rows.map((r) => [
    r.year, r.month, r.category.name, r.category.currency,
    Number(r.target), Number(r.actual), r.note,
  ].map(csvCell).join(",")).join("\n");
  return `${header}\n${body}\n`;
}

export async function exportCryptoCsv(): Promise<string> {
  const rows = await prisma.cryptoTransaction.findMany({
    include: { asset: true },
    orderBy: { occurredAt: "asc" },
  });
  const header = "OccurredAt,Symbol,Type,Amount,PricePerUnit,TotalUsd,Fee,FeeCurrency,Note";
  const body = rows.map((r) => [
    r.occurredAt.toISOString(),
    r.asset.symbol,
    r.type,
    Number(r.amount),
    r.pricePerUnit === null ? null : Number(r.pricePerUnit),
    r.totalUsd === null ? null : Number(r.totalUsd),
    r.fee === null ? null : Number(r.fee),
    r.feeCurrency,
    r.note,
  ].map(csvCell).join(",")).join("\n");
  return `${header}\n${body}\n`;
}
