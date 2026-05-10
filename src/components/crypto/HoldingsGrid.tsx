"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent } from "@/lib/format";
import { MoneyDisplay, PrivateText } from "@/components/dashboard/MoneyDisplay";
import { cn } from "@/lib/utils";
import type { Holding, LivePrice } from "./CryptoClient";

export function HoldingsGrid({
  holdings,
  prices,
  loading,
}: {
  holdings: Holding[];
  prices: Record<string, LivePrice>;
  loading: boolean;
}) {
  if (holdings.length === 0) {
    return <p className="text-muted-foreground">No holdings yet. Import a CSV or add a transaction to get started.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {holdings.map((h) => {
        const live = prices[h.cmcSymbol];
        const value = live ? h.amount * live.price : null;
        const pl = value !== null ? value - h.costBasis : null;
        const plPct = pl !== null && h.costBasis > 0 ? pl / h.costBasis : null;
        const positive = pl !== null && pl >= 0;

        return (
          <Card key={h.assetId} className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur transition-colors hover:border-border">
            <div className={cn(
              "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-25",
              pl === null ? "bg-slate-500" : positive ? "bg-emerald-500" : "bg-rose-500",
            )} />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xl font-bold">{h.symbol}</span>
                  <span className="text-xs text-muted-foreground">{h.name}</span>
                </div>
                {live && (
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-mono",
                    live.change24h < 0 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400",
                  )}>
                    {live.change24h < 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                    {Math.abs(live.change24h).toFixed(2)}%
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative space-y-3 pb-5">
              <div>
                {loading && !live ? (
                  <Skeleton className="h-7 w-24" />
                ) : value !== null ? (
                  <MoneyDisplay amount={value} from="USD" className="text-2xl font-bold" />
                ) : (
                  <MoneyDisplay amount={h.costBasis} from="USD" className="text-2xl font-bold" />
                )}
                <div className="text-xs text-muted-foreground font-mono">
                  <PrivateText className="text-xs">
                    {h.amount.toLocaleString("en-US", { maximumFractionDigits: 6 })}
                  </PrivateText>{" "}{h.symbol}
                  {live && <span className="ml-2">@ <MoneyDisplay amount={live.price} from="USD" className="text-xs" /></span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/50 pt-3">
                <Stat label="Cost basis" value={<MoneyDisplay amount={h.costBasis} from="USD" className="text-xs" />} />
                <Stat label="Avg cost" value={<MoneyDisplay amount={h.avgCost} from="USD" className="text-xs" />} />
              </div>

              {pl !== null && (
                <div className={cn(
                  "rounded-md px-3 py-2 text-sm font-mono flex items-center justify-between",
                  positive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400",
                )}>
                  <span className="text-xs uppercase tracking-wide opacity-70">P/L</span>
                  <span className="flex items-center gap-2">
                    <MoneyDisplay amount={pl} from="USD" className={cn("text-sm", positive ? "text-emerald-400" : "text-rose-400")} />
                    {plPct !== null && <span className="opacity-80">(<PrivateText fallback="••">{formatPercent(plPct)}</PrivateText>)</span>}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
