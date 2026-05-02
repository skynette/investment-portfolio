"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDisplayCurrency } from "./CurrencyContext";

export function BalanceVisibilityToggle() {
  const { showBalances, setShowBalances } = useDisplayCurrency();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowBalances(!showBalances)}
      className="h-8 w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
      aria-label={showBalances ? "Hide balances" : "Show balances"}
      title={showBalances ? "Hide balances" : "Show balances"}
    >
      {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      {showBalances ? "Hide balances" : "Show balances"}
    </Button>
  );
}
