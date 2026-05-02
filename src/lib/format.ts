export type Currency = "NGN" | "USD";

const SYMBOLS: Record<Currency, string> = {
  NGN: "₦",
  USD: "$",
};

export function formatMoney(amount: number, currency: Currency): string {
  const symbol = SYMBOLS[currency];
  const sign = amount < 0 ? "-" : "";
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${symbol}${formatted}`;
}

export function formatCompactMoney(amount: number, currency: Currency): string {
  const symbol = SYMBOLS[currency];
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    return `${sign}${symbol}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (abs >= 1000) {
    return `${sign}${symbol}${(abs / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `${sign}${symbol}${Math.round(abs)}`;
}

export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}
