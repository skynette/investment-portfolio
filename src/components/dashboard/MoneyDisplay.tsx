"use client";

import { formatCompactMoney, formatMoney, type Currency } from "@/lib/format";
import { useDisplayCurrency, convert } from "@/components/layout/CurrencyContext";
import { cn } from "@/lib/utils";

/**
 * Renders a money amount in the user's currently selected display currency.
 * `from` is the currency the amount is natively stored in.
 */
export function MoneyDisplay({
  amount,
  from,
  compact = false,
  className,
}: {
  amount: number;
  from: Currency;
  compact?: boolean;
  className?: string;
}) {
  const { display, fxRate } = useDisplayCurrency();
  const converted = convert(amount, from, display, fxRate);

  // If we don't have FX and need conversion, fall back to native
  const effectiveCurrency: Currency =
    from === display || fxRate !== null ? display : from;
  const effectiveAmount = from === display || fxRate !== null ? converted : amount;

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {compact
        ? formatCompactMoney(effectiveAmount, effectiveCurrency)
        : formatMoney(effectiveAmount, effectiveCurrency)}
    </span>
  );
}
