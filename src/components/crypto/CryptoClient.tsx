"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Coins, RefreshCw, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { HoldingsGrid } from "./HoldingsGrid";
import { TransactionTable } from "./TransactionTable";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { ImportCsvDialog } from "./ImportCsvDialog";
import { CryptoExportButton } from "./ExportButton";
import { CryptoCopyButton } from "./CopyButton";
import { formatPercent } from "@/lib/format";
import { MoneyDisplay, PrivateText } from "@/components/dashboard/MoneyDisplay";
import { cn } from "@/lib/utils";

export type Holding = {
  assetId: number;
  symbol: string;
  name: string;
  cmcSymbol: string;
  amount: number;
  costBasis: number;
  avgCost: number;
};

export type TxRow = {
  id: number;
  occurredAt: string;
  type: string;
  symbol: string;
  name: string;
  assetId: number;
  amount: number;
  pricePerUnit: number | null;
  totalUsd: number | null;
  note: string | null;
};

export type LivePrice = { price: number; change1h: number; change24h: number; change7d: number };

export function CryptoClient({
  holdings, transactions, assets, summary,
}: {
  holdings: Holding[];
  transactions: TxRow[];
  assets: { id: number; symbol: string; name: string }[];
  summary: {
    valueUsd: number;
    costUsd: number;
    plUsd: number;
    plPct: number;
    txCount: number;
  };
}) {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const symbolsKey = holdings.map((h) => h.cmcSymbol).join(",");

  const refresh = useCallback(async () => {
    if (!symbolsKey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/prices?symbols=${symbolsKey}`);
      if (res.ok) {
        const data: Record<string, LivePrice> = await res.json();
        setPrices(data);
        setHasFetched(true);
      }
    } finally {
      setLoading(false);
    }
  }, [symbolsKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Once live prices arrive, recompute summary from them so KPI cards stay in
  // sync with the per-asset cards. Until then, fall back to the server-rendered
  // summary so the cards aren't blank on first paint.
  const liveSummary = useMemo(() => {
    if (!hasFetched) {
      return {
        valueUsd: summary.valueUsd,
        costUsd: summary.costUsd,
        plUsd: summary.plUsd,
        plPct: summary.plPct,
      };
    }
    let valueUsd = 0;
    let costUsd = 0;
    for (const h of holdings) {
      costUsd += h.costBasis;
      const live = prices[h.cmcSymbol];
      if (live) valueUsd += h.amount * live.price;
      else valueUsd += h.costBasis; // unknown price → neutral contribution
    }
    const plUsd = valueUsd - costUsd;
    const plPct = costUsd > 0 ? plUsd / costUsd : 0;
    return { valueUsd, costUsd, plUsd, plPct };
  }, [hasFetched, holdings, prices, summary]);

  const positive = liveSummary.plUsd >= 0;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold">Crypto</h2>
          <p className="text-sm text-muted-foreground">{holdings.length} holdings · {summary.txCount} transactions</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh prices
          </Button>
          <CryptoCopyButton
            holdings={holdings}
            summary={liveSummary}
            prices={prices}
          />
          <CryptoExportButton />
          <ImportCsvDialog />
          <AddTransactionDialog assets={assets} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Portfolio value"
          value={<MoneyDisplay amount={liveSummary.valueUsd} from="USD" className="text-2xl sm:text-3xl font-bold" />}
          icon={Wallet}
          accent="violet"
        />
        <SummaryCard
          label="Cost basis"
          value={<MoneyDisplay amount={liveSummary.costUsd} from="USD" className="text-2xl sm:text-3xl font-bold" />}
          icon={Coins}
          accent="muted"
        />
        <SummaryCard
          label="All-time P/L"
          value={
            <MoneyDisplay
              amount={liveSummary.plUsd}
              from="USD"
              className={cn("text-2xl sm:text-3xl font-bold", positive ? "text-emerald-400" : "text-rose-400")}
            />
          }
          icon={positive ? ArrowUpRight : ArrowDownRight}
          accent={positive ? "green" : "red"}
        />
        <SummaryCard
          label="Return"
          value={
            <PrivateText fallback="••%" className={cn(
              "text-2xl sm:text-3xl font-bold",
              positive ? "text-emerald-400" : "text-rose-400",
            )}>{formatPercent(liveSummary.plPct)}</PrivateText>
          }
          icon={TrendingUp}
          accent={positive ? "green" : "red"}
        />
      </div>

      <Tabs defaultValue="holdings">
        <TabsList>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="holdings" className="mt-6">
          <HoldingsGrid holdings={holdings} prices={prices} loading={loading} />
        </TabsContent>
        <TabsContent value="transactions" className="mt-6">
          <TransactionTable transactions={transactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  label, value, icon: Icon, accent,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  accent: "green" | "red" | "violet" | "muted";
}) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur">
      <div className={cn(
        "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-30",
        accent === "green" && "bg-emerald-500",
        accent === "red" && "bg-rose-500",
        accent === "violet" && "bg-violet-500",
        accent === "muted" && "bg-slate-500",
      )} />
      <CardContent className="relative space-y-2 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>{value}</div>
      </CardContent>
    </Card>
  );
}
