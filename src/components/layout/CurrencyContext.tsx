"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Currency } from "@/lib/format";

type Ctx = {
  display: Currency;
  setDisplay: (c: Currency) => void;
  fxRate: number | null;
  showBalances: boolean;
  setShowBalances: (v: boolean) => void;
};

const CurrencyContext = createContext<Ctx | null>(null);

const STORAGE_CURRENCY = "portfolio.displayCurrency";
const STORAGE_BALANCES = "portfolio.showBalances";

export function CurrencyProvider({
  fxRate,
  children,
}: {
  fxRate: number | null;
  children: React.ReactNode;
}) {
  const [display, setDisplayState] = useState<Currency>("NGN");
  const [showBalances, setShowBalancesState] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const c = localStorage.getItem(STORAGE_CURRENCY);
    if (c === "NGN" || c === "USD") setDisplayState(c);
    const b = localStorage.getItem(STORAGE_BALANCES);
    if (b === "0") setShowBalancesState(false);
  }, []);

  const setDisplay = (c: Currency) => {
    setDisplayState(c);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_CURRENCY, c);
  };

  const setShowBalances = (v: boolean) => {
    setShowBalancesState(v);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_BALANCES, v ? "1" : "0");
  };

  return (
    <CurrencyContext.Provider value={{ display, setDisplay, fxRate, showBalances, setShowBalances }}>
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
