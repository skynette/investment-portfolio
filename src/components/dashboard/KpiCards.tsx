"use client";

import { ArrowDownRight, ArrowUpRight, Wallet, Target, Coins, PiggyBank } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { useDisplayCurrency, convert } from "@/components/layout/CurrencyContext";
import { MoneyDisplay, PrivateText } from "./MoneyDisplay";
import { cn } from "@/lib/utils";

export function KpiCards({
  monthTarget,
  monthActual,
  cryptoValueUsd,
  cryptoCostUsd,
  cryptoPLUsd,
  cryptoPLPct,
  monthlyAllTimeNgn,
}: {
  monthTarget: number;        // NGN
  monthActual: number;        // NGN
  cryptoValueUsd: number;
  cryptoCostUsd: number;
  cryptoPLUsd: number;
  cryptoPLPct: number;
  monthlyAllTimeNgn: number;  // sum of all monthly actuals in NGN, all months
}) {
  const { display, fxRate } = useDisplayCurrency();
  const monthPct = monthTarget > 0 ? monthActual / monthTarget : 0;

  // Total committed (cost basis) across both: monthly actuals + crypto buys
  const totalCommittedInDisplay =
    convert(monthlyAllTimeNgn, "NGN", display, fxRate) +
    convert(cryptoCostUsd, "USD", display, fxRate);

  const cards: Array<{
    label: string;
    value: React.ReactNode;
    sub: React.ReactNode;
    accent: "green" | "red" | "muted" | "violet" | "amber";
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      label: "This month invested",
      value: <MoneyDisplay amount={monthActual} from="NGN" className="text-2xl sm:text-3xl font-bold" />,
      sub: (
        <span className="text-xs text-muted-foreground">
          of <MoneyDisplay amount={monthTarget} from="NGN" compact /> target
        </span>
      ),
      accent: "violet",
      icon: Wallet,
    },
    {
      label: "Month progress",
      value: (
        <div className="flex items-end gap-2">
          <PrivateText fallback="••%" className="text-2xl sm:text-3xl font-bold">{formatPercent(monthPct)}</PrivateText>
          {monthPct >= 1 ? (
            <ArrowUpRight className="mb-1 h-5 w-5 text-emerald-500" />
          ) : null}
        </div>
      ),
      sub: <ProgressBar value={monthPct} />,
      accent: "amber",
      icon: Target,
    },
    {
      label: "Crypto value",
      value: <MoneyDisplay amount={cryptoValueUsd} from="USD" className="text-2xl sm:text-3xl font-bold" />,
      sub: (
        <span className={cn(
          "inline-flex items-center gap-1 text-xs font-mono",
          cryptoPLUsd < 0 ? "text-rose-400" : "text-emerald-400",
        )}>
          {cryptoPLUsd < 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
          <PrivateText fallback="••%" className="text-xs">{formatPercent(cryptoPLPct)}</PrivateText> all-time
        </span>
      ),
      accent: "green",
      icon: Coins,
    },
    {
      label: "Total committed",
      value: <MoneyDisplay amount={totalCommittedInDisplay} from={display} className="text-2xl sm:text-3xl font-bold" />,
      sub: (
        <span className="text-xs text-muted-foreground">
          monthly + crypto cost basis
        </span>
      ),
      accent: "muted",
      icon: PiggyBank,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className={cn(
            "relative overflow-hidden border-border/60 bg-card/60 backdrop-blur",
            "transition-colors hover:border-border",
          )}>
            <div className={cn(
              "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-30",
              c.accent === "green" && "bg-emerald-500",
              c.accent === "red" && "bg-rose-500",
              c.accent === "violet" && "bg-violet-500",
              c.accent === "amber" && "bg-amber-500",
              c.accent === "muted" && "bg-slate-500",
            )} />
            <CardContent className="relative space-y-2 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>{c.value}</div>
              <div>{c.sub}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          pct >= 1 ? "bg-emerald-500" : "bg-amber-500",
        )}
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}
