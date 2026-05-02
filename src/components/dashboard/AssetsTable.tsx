"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatPercent } from "@/lib/format";
import { MoneyDisplay, PrivateText } from "./MoneyDisplay";
import { cn } from "@/lib/utils";

export type AssetRow = {
  symbol: string;
  name: string;
  price: number | null;
  change1h: number | null;
  change24h: number | null;
  change7d: number | null;
  amount: number;
  avgCost: number;
  costBasis: number;
  value: number | null;
  pl: number | null;
  plPct: number | null;
};

export function AssetsTable({ rows }: { rows: AssetRow[] }) {
  if (rows.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        No crypto holdings yet.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Asset</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">1h%</TableHead>
            <TableHead className="text-right">24h%</TableHead>
            <TableHead className="text-right">7d%</TableHead>
            <TableHead className="text-right">Holdings</TableHead>
            <TableHead className="text-right">Avg buy</TableHead>
            <TableHead className="text-right">P/L</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.symbol}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold">{r.symbol}</span>
                  <span className="text-xs text-muted-foreground">{r.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">{r.price !== null ? <MoneyDisplay amount={r.price} from="USD" /> : "—"}</TableCell>
              <PctCell value={r.change1h} />
              <PctCell value={r.change24h} />
              <PctCell value={r.change7d} />
              <TableCell className="text-right">
                <div className="flex flex-col items-end">
                  {r.value !== null ? (
                    <MoneyDisplay amount={r.value} from="USD" />
                  ) : (
                    <MoneyDisplay amount={r.costBasis} from="USD" />
                  )}
                  <span className="text-xs text-muted-foreground font-mono">
                    <PrivateText className="text-xs">
                      {r.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                    </PrivateText>{" "}{r.symbol}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right"><MoneyDisplay amount={r.avgCost} from="USD" /></TableCell>
              <TableCell className="text-right">
                {r.pl === null ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <div className={cn(
                    "flex flex-col items-end font-mono",
                    r.pl < 0 ? "text-rose-400" : "text-emerald-400",
                  )}>
                    <MoneyDisplay amount={r.pl} from="USD" className={r.pl < 0 ? "text-rose-400" : "text-emerald-400"} />
                    {r.plPct !== null && (
                      <span className="text-xs"><PrivateText fallback="••" className="text-xs">{formatPercent(r.plPct)}</PrivateText></span>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function PctCell({ value }: { value: number | null }) {
  if (value === null) return <TableCell className="text-right text-muted-foreground">—</TableCell>;
  const positive = value >= 0;
  return (
    <TableCell className={cn(
      "text-right font-mono",
      positive ? "text-emerald-400" : "text-rose-400",
    )}>
      <span className="inline-flex items-center gap-1 justify-end">
        {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {Math.abs(value).toFixed(2)}%
      </span>
    </TableCell>
  );
}
