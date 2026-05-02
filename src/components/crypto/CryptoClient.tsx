"use client";

import { ArrowUpRight, ArrowDownRight, Coins, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoldingsGrid } from "./HoldingsGrid";
import { TransactionTable } from "./TransactionTable";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { ImportCsvDialog } from "./ImportCsvDialog";
import { CryptoExportButton } from "./ExportButton";
import { formatPercent } from "@/lib/format";
import { MoneyDisplay } from "@/components/dashboard/MoneyDisplay";
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
  const positive = summary.plUsd >= 0;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Crypto</h2>
          <p className="text-sm text-muted-foreground">{holdings.length} holdings · {summary.txCount} transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <CryptoExportButton />
          <ImportCsvDialog />
          <AddTransactionDialog assets={assets} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Portfolio value"
          value={<MoneyDisplay amount={summary.valueUsd} from="USD" className="text-3xl font-bold" />}
          icon={Wallet}
          accent="violet"
        />
        <SummaryCard
          label="Cost basis"
          value={<MoneyDisplay amount={summary.costUsd} from="USD" className="text-3xl font-bold" />}
          icon={Coins}
          accent="muted"
        />
        <SummaryCard
          label="All-time P/L"
          value={
            <MoneyDisplay
              amount={summary.plUsd}
              from="USD"
              className={cn("text-3xl font-bold", positive ? "text-emerald-400" : "text-rose-400")}
            />
          }
          icon={positive ? ArrowUpRight : ArrowDownRight}
          accent={positive ? "green" : "red"}
        />
        <SummaryCard
          label="Return"
          value={
            <span className={cn(
              "text-3xl font-bold font-mono tabular-nums",
              positive ? "text-emerald-400" : "text-rose-400",
            )}>{formatPercent(summary.plPct)}</span>
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
          <HoldingsGrid holdings={holdings} />
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
