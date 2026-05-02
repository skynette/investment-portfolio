import { getMonth } from "@/server/actions/monthly";
import { listAssets } from "@/server/actions/assets";
import { listTransactions } from "@/server/actions/transactions";
import { fetchPrices } from "@/server/lib/cmc";
import { computeHolding } from "@/server/lib/holdings";
import { currentYearMonth, formatYearMonth } from "@/lib/dates";
import { prisma } from "@/server/lib/db";
import { DashboardMonthSelector } from "@/components/dashboard/DashboardMonthSelector";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { MonthlyBarChart } from "@/components/dashboard/MonthlyBarChart";
import { PerformerCards, type Performer } from "@/components/dashboard/PerformerCards";
import { AssetsTable, type AssetRow } from "@/components/dashboard/AssetsTable";
import { RecentActivity, type ActivityItem } from "@/components/dashboard/RecentActivity";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const ym = sp.year && sp.month
    ? { year: Number(sp.year), month: Number(sp.month) }
    : currentYearMonth();

  const [monthRows, assets, txs, allMonthly] = await Promise.all([
    getMonth(ym),
    listAssets(),
    listTransactions(),
    prisma.monthlyEntry.findMany({ select: { actual: true } }),
  ]);

  const symbols = assets.filter((a) => a.isActive).map((a) => a.cmcSymbol);
  const prices = await fetchPrices(symbols);

  // Monthly metrics scoped to selected month
  const monthTarget = monthRows.reduce((s, r) => s + Number(r.target), 0);
  const monthActual = monthRows.reduce((s, r) => s + Number(r.actual), 0);
  const monthlyAllTimeNgn = allMonthly.reduce((s, r) => s + Number(r.actual), 0);

  // Crypto holdings + per-asset numbers
  const txsByAsset = new Map<number, typeof txs>();
  for (const t of txs) {
    const arr = txsByAsset.get(t.assetId) ?? [];
    arr.push(t);
    txsByAsset.set(t.assetId, arr);
  }

  let cryptoValueUsd = 0;
  let cryptoCostUsd = 0;
  const assetRows: AssetRow[] = [];
  const performers: { symbol: string; name: string; plPct: number; plUsd: number }[] = [];

  for (const a of assets) {
    const h = computeHolding(
      (txsByAsset.get(a.id) ?? []).map((t) => ({
        type: t.type as "buy" | "sell" | "transferIn" | "transferOut",
        amount: Number(t.amount),
        totalUsd: t.totalUsd === null ? null : Number(t.totalUsd),
      })),
    );
    if (h.amount <= 0) continue;

    const live = prices[a.cmcSymbol];
    const value = live ? h.amount * live.price : null;
    const pl = value !== null ? value - h.costBasis : null;
    const plPct = pl !== null && h.costBasis > 0 ? pl / h.costBasis : null;

    cryptoCostUsd += h.costBasis;
    if (value !== null) cryptoValueUsd += value;

    assetRows.push({
      symbol: a.symbol,
      name: a.name,
      price: live?.price ?? null,
      change1h: live?.change1h ?? null,
      change24h: live?.change24h ?? null,
      change7d: live?.change7d ?? null,
      amount: h.amount,
      avgCost: h.avgCost,
      costBasis: h.costBasis,
      value,
      pl,
      plPct,
    });

    if (plPct !== null && pl !== null) {
      performers.push({ symbol: a.symbol, name: a.name, plPct, plUsd: pl });
    }
  }

  // Sort assets by value desc
  assetRows.sort((a, b) => (b.value ?? b.costBasis) - (a.value ?? a.costBasis));

  const cryptoPLUsd = cryptoValueUsd - cryptoCostUsd;
  const cryptoPLPct = cryptoCostUsd > 0 ? cryptoPLUsd / cryptoCostUsd : 0;

  let best: Performer | null = null;
  let worst: Performer | null = null;
  if (performers.length > 0) {
    const sorted = [...performers].sort((a, b) => b.plPct - a.plPct);
    best = sorted[0];
    worst = sorted[sorted.length - 1];
    if (best.symbol === worst.symbol) worst = null;
  }

  // Bar chart for selected month
  const barData = monthRows.map((r) => ({
    name: r.category.name,
    target: Number(r.target),
    actual: Number(r.actual),
  }));

  // Recent activity — only meaningful entries (skip zero-actual monthly rows)
  const recentMonthly = await prisma.monthlyEntry.findMany({
    where: { actual: { gt: 0 } },
    include: { category: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });
  const recentTxs = await prisma.cryptoTransaction.findMany({
    include: { asset: true },
    orderBy: { occurredAt: "desc" },
    take: 5,
  });

  const activity: ActivityItem[] = [
    ...recentMonthly.map((m): ActivityItem => ({
      kind: "monthly",
      at: m.updatedAt.toISOString(),
      label: `${m.category.name} · ${m.year}-${String(m.month).padStart(2, "0")}`,
      amount: Number(m.actual),
      currency: m.category.currency as "NGN" | "USD",
    })),
    ...recentTxs.map((t): ActivityItem => ({
      kind: "crypto",
      at: t.occurredAt.toISOString(),
      label: `${t.asset.symbol} · ${t.type}`,
      amount: Number(t.amount),
      symbol: t.asset.symbol,
      type: t.type,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Showing monthly metrics for {formatYearMonth(ym)}</p>
        </div>
        <DashboardMonthSelector value={ym} />
      </div>

      <KpiCards
        monthTarget={monthTarget}
        monthActual={monthActual}
        cryptoValueUsd={cryptoValueUsd}
        cryptoCostUsd={cryptoCostUsd}
        cryptoPLUsd={cryptoPLUsd}
        cryptoPLPct={cryptoPLPct}
        monthlyAllTimeNgn={monthlyAllTimeNgn}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border/60 bg-card/60 backdrop-blur p-5">
          <h3 className="mb-4 text-lg font-semibold">Target vs Actual — {formatYearMonth(ym)}</h3>
          <MonthlyBarChart data={barData} />
        </div>
        <div className="space-y-4">
          <PerformerCards best={best} worst={worst} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Crypto assets</h3>
        <AssetsTable rows={assetRows} />
      </div>

      <RecentActivity items={activity} />
    </div>
  );
}
