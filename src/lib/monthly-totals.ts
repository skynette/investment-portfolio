import { convert } from "@/components/layout/CurrencyContext";
import type { Currency } from "@/lib/format";

type MoneyRow = {
  amount: number;
  currency: Currency;
};

type ProgressRow = {
  target: number;
  actual: number;
  currency: Currency;
};

export function summarizeMoneyTotal(
  rows: MoneyRow[],
  display: Currency,
  fxRate: number | null,
): {
  amount: number | null;
  currency: Currency | null;
  canDisplay: boolean;
} {
  if (rows.length === 0) {
    return { amount: 0, currency: display, canDisplay: true };
  }

  const currencies = new Set(rows.map((row) => row.currency));

  if (currencies.size === 1) {
    const nativeCurrency = rows[0]!.currency;
    const total = rows.reduce((sum, row) => sum + row.amount, 0);
    if (nativeCurrency === display || fxRate !== null) {
      return {
        amount: convert(total, nativeCurrency, display, fxRate),
        currency: display,
        canDisplay: true,
      };
    }
    return { amount: total, currency: nativeCurrency, canDisplay: true };
  }

  if (fxRate === null) {
    return { amount: null, currency: null, canDisplay: false };
  }

  return {
    amount: rows.reduce(
      (sum, row) => sum + convert(row.amount, row.currency, display, fxRate),
      0,
    ),
    currency: display,
    canDisplay: true,
  };
}

export function summarizeProgress(
  rows: ProgressRow[],
  display: Currency,
  fxRate: number | null,
): number | null {
  const target = summarizeMoneyTotal(
    rows.map((row) => ({ amount: row.target, currency: row.currency })),
    display,
    fxRate,
  );
  const actual = summarizeMoneyTotal(
    rows.map((row) => ({ amount: row.actual, currency: row.currency })),
    display,
    fxRate,
  );

  if (!target.canDisplay || !actual.canDisplay || !target.amount || actual.amount === null) {
    return null;
  }

  return target.amount > 0 ? actual.amount / target.amount : 0;
}
