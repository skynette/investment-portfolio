"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatMoney, formatPercent, type Currency } from "@/lib/format";
import { formatYearMonth, type YearMonth } from "@/lib/dates";
import { useDisplayCurrency, convert } from "@/components/layout/CurrencyContext";

type Row = {
  target: number;
  actual: number;
  category: { name: string; currency: string };
};

export function MonthlyCopyButton({ rows, ym }: { rows: Row[]; ym: YearMonth }) {
  const { display, fxRate } = useDisplayCurrency();

  const buildMessage = () => {
    const fmt = (amount: number, from: Currency) => {
      const cur = from === display || fxRate !== null ? display : from;
      const value = from === display || fxRate !== null ? convert(amount, from, display, fxRate) : amount;
      return formatMoney(value, cur);
    };

    const lines: string[] = [];
    lines.push(`*Monthly Investments — ${formatYearMonth(ym)}*`);
    lines.push("");

    let totalActual = 0;
    let totalTarget = 0;
    let totalCurrency: Currency = "NGN";

    for (const r of rows) {
      const cur = r.category.currency as Currency;
      totalCurrency = cur;
      totalActual += r.actual;
      totalTarget += r.target;
      const pct = r.target > 0 ? formatPercent(r.actual / r.target) : "—";
      lines.push(`• ${r.category.name}: ${fmt(r.actual, cur)} / ${fmt(r.target, cur)} _(${pct})_`);
    }

    if (rows.length > 0) {
      lines.push("");
      const totalPct = totalTarget > 0 ? formatPercent(totalActual / totalTarget) : "—";
      lines.push(`*Total:* ${fmt(totalActual, totalCurrency)} / ${fmt(totalTarget, totalCurrency)} _(${totalPct})_`);
    }

    return lines.join("\n");
  };

  const onClick = async () => {
    if (rows.length === 0) {
      toast.error("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(buildMessage());
      toast.success("Copied — paste into WhatsApp");
    } catch {
      toast.error("Couldn't copy. Check browser clipboard permissions.");
    }
  };

  return (
    <Button variant="outline" onClick={onClick}>
      <Copy className="mr-2 h-4 w-4" /> Copy as message
    </Button>
  );
}
