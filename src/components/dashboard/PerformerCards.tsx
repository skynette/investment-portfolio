"use client";

import { ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { MoneyDisplay, PrivateText } from "./MoneyDisplay";
import { cn } from "@/lib/utils";

export type Performer = {
  symbol: string;
  name: string;
  plPct: number;
  plUsd: number;
};

export function PerformerCards({ best, worst }: { best: Performer | null; worst: Performer | null }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <PerformerCard label="Best performer" performer={best} kind="best" />
      <PerformerCard label="Worst performer" performer={worst} kind="worst" />
    </div>
  );
}

function PerformerCard({
  label, performer, kind,
}: {
  label: string;
  performer: Performer | null;
  kind: "best" | "worst";
}) {
  const isPositive = (performer?.plPct ?? 0) >= 0;
  const Icon = kind === "best" ? TrendingUp : TrendingDown;
  const ArrowIcon = isPositive ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur">
      <div className={cn(
        "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-25",
        kind === "best" ? "bg-emerald-500" : "bg-rose-500",
      )} />
      <CardContent className="relative space-y-2 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
          <Icon className={cn("h-4 w-4", kind === "best" ? "text-emerald-500" : "text-rose-500")} />
        </div>
        {performer ? (
          <>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">{performer.symbol}</span>
              <span className="text-sm text-muted-foreground">{performer.name}</span>
            </div>
            <div className={cn(
              "inline-flex items-center gap-1 text-sm font-mono",
              isPositive ? "text-emerald-400" : "text-rose-400",
            )}>
              <ArrowIcon className="h-4 w-4" />
              <PrivateText fallback="••%" className={cn("text-sm", isPositive ? "text-emerald-400" : "text-rose-400")}>
                {formatPercent(performer.plPct)}
              </PrivateText>
              <span className="ml-2 text-muted-foreground">
                (<MoneyDisplay amount={performer.plUsd} from="USD" className={cn("text-sm", isPositive ? "text-emerald-400" : "text-rose-400")} />)
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No holdings yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
