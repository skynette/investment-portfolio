"use client";

import { formatCompactMoney, formatMoney, type Currency } from "@/lib/format";
import { useDisplayCurrency, convert } from "@/components/layout/CurrencyContext";
import { cn } from "@/lib/utils";

const MASK = "••••";

const SYMBOL: Record<Currency, string> = {
  NGN: "₦",
  USD: "$",
};

/**
 * Renders a money amount in the user's currently selected display currency.
 * `from` is the currency the amount is natively stored in.
 * Masks to ••••• when balances are hidden via the privacy toggle.
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
  const { display, fxRate, showBalances } = useDisplayCurrency();

  const effectiveCurrency: Currency =
    from === display || fxRate !== null ? display : from;

  if (!showBalances) {
    return (
      <span className={cn("font-mono tabular-nums select-none", className)}>
        {SYMBOL[effectiveCurrency]}{MASK}
      </span>
    );
  }

  const converted = convert(amount, from, display, fxRate);
  const effectiveAmount = from === display || fxRate !== null ? converted : amount;

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {compact
        ? formatCompactMoney(effectiveAmount, effectiveCurrency)
        : formatMoney(effectiveAmount, effectiveCurrency)}
    </span>
  );
}

/** Generic masked text for non-money balances (token quantities, counts that reveal size). */
export function PrivateText({
  children,
  fallback = MASK,
  className,
}: {
  children: React.ReactNode;
  fallback?: string;
  className?: string;
}) {
  const { showBalances } = useDisplayCurrency();
  return (
    <span className={cn("font-mono tabular-nums", !showBalances && "select-none", className)}>
      {showBalances ? children : fallback}
    </span>
  );
}
