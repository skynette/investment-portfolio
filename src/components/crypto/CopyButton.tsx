"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatMoney, formatPercent, type Currency } from "@/lib/format";
import { useDisplayCurrency, convert } from "@/components/layout/CurrencyContext";
import type { Holding, LivePrice } from "./CryptoClient";

type Summary = {
  valueUsd: number;
  costUsd: number;
  plUsd: number;
  plPct: number;
};

export function CryptoCopyButton({
  holdings,
  summary,
  prices,
}: {
  holdings: Holding[];
  summary: Summary;
  prices: Record<string, LivePrice>;
}) {
  const [pending, setPending] = useState(false);
  const { display, fxRate } = useDisplayCurrency();

  const fmt = (usd: number) => {
    const cur: Currency = fxRate !== null || display === "USD" ? display : "USD";
    const value = fxRate !== null || display === "USD" ? convert(usd, "USD", display, fxRate) : usd;
    return formatMoney(value, cur);
  };

  const onClick = async () => {
    if (holdings.length === 0) {
      toast.error("Nothing to copy");
      return;
    }
    setPending(true);
    try {
      const lines: string[] = [];
      lines.push(`*Crypto Portfolio*`);
      lines.push("");
      lines.push(`Value: ${fmt(summary.valueUsd)}`);
      lines.push(`Cost basis: ${fmt(summary.costUsd)}`);
      const sign = summary.plUsd >= 0 ? "+" : "";
      lines.push(`P/L: ${sign}${fmt(summary.plUsd)} _(${formatPercent(summary.plPct)})_`);
      lines.push("");
      lines.push(`*Holdings:*`);

      const sorted = [...holdings].sort((a, b) => {
        const av = (prices[a.cmcSymbol]?.price ?? 0) * a.amount || a.costBasis;
        const bv = (prices[b.cmcSymbol]?.price ?? 0) * b.amount || b.costBasis;
        return bv - av;
      });

      for (const h of sorted) {
        const live = prices[h.cmcSymbol];
        const value = live ? h.amount * live.price : null;
        const pl = value !== null ? value - h.costBasis : null;
        const plPct = pl !== null && h.costBasis > 0 ? pl / h.costBasis : null;
        const amt = h.amount.toLocaleString("en-US", { maximumFractionDigits: 4 });

        if (value !== null && pl !== null && plPct !== null) {
          const plSign = pl >= 0 ? "+" : "";
          lines.push(`• ${h.symbol}: ${amt} — ${fmt(value)} _(${plSign}${formatPercent(plPct)})_`);
        } else {
          lines.push(`• ${h.symbol}: ${amt} — cost ${fmt(h.costBasis)}`);
        }
      }

      lines.push("");
      lines.push(`_${new Date().toLocaleDateString()}_`);

      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("Copied — paste into WhatsApp");
    } catch {
      toast.error("Couldn't copy. Check browser clipboard permissions.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button variant="outline" onClick={onClick} disabled={pending}>
      <Copy className="mr-2 h-4 w-4" />
      {pending ? "Copying..." : "Copy as message"}
    </Button>
  );
}
