"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Currency } from "@/lib/format";

type Ctx = {
  display: Currency;
  setDisplay: (c: Currency) => void;
  fxRate: number | null;
};

const CurrencyContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "portfolio.displayCurrency";

export function CurrencyProvider({
  fxRate,
  children,
}: {
  fxRate: number | null;
  children: React.ReactNode;
}) {
  const [display, setDisplayState] = useState<Currency>("NGN");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored === "NGN" || stored === "USD") setDisplayState(stored);
  }, []);

  const setDisplay = (c: Currency) => {
    setDisplayState(c);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, c);
  };

  return (
    <CurrencyContext.Provider value={{ display, setDisplay, fxRate }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useDisplayCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useDisplayCurrency must be used within CurrencyProvider");
  return ctx;
}

/** Convert a money amount from its native currency into the user's display currency. */
export function convert(amount: number, from: Currency, to: Currency, fxRate: number | null): number {
  if (from === to) return amount;
  if (fxRate === null || fxRate <= 0) return amount;
  if (from === "NGN" && to === "USD") return amount / fxRate;
  if (from === "USD" && to === "NGN") return amount * fxRate;
  return amount;
}
