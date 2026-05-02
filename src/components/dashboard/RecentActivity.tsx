"use client";

import { ArrowDownLeft, ArrowUpRight, Coins, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyDisplay, PrivateText } from "./MoneyDisplay";
import type { Currency } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ActivityItem =
  | { kind: "monthly"; at: string; label: string; amount: number; currency: Currency }
  | { kind: "crypto"; at: string; label: string; amount: number; symbol: string; type: string };

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <Card className="border-border/60 bg-card/60 backdrop-blur">
        <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No activity yet.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
      <CardContent>
        <ul className="divide-y divide-border/60">
          {items.map((item, i) => {
            const isMonthly = item.kind === "monthly";
            const Icon = isMonthly ? Wallet : Coins;
            return (
              <li key={i} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full",
                    isMonthly ? "bg-violet-500/10 text-violet-400" : "bg-emerald-500/10 text-emerald-400",
                  )}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{new Date(item.at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  {item.kind === "monthly" ? (
                    <MoneyDisplay amount={item.amount} from={item.currency} className="text-sm" />
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-sm">
                      {item.type === "buy" ? (
                        <ArrowDownLeft className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3 text-rose-400" />
                      )}
                      <PrivateText className="text-sm">
                        {item.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                      </PrivateText>{" "}{item.symbol}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
