"use client";

import { Button } from "@/components/ui/button";
import { useDisplayCurrency } from "./CurrencyContext";
import { cn } from "@/lib/utils";

export function CurrencyToggle() {
  const { display, setDisplay } = useDisplayCurrency();
  return (
    <div className="inline-flex items-center rounded-md border bg-muted/30 p-0.5 text-xs">
      {(["NGN", "USD"] as const).map((c) => (
        <Button
          key={c}
          variant="ghost"
          size="sm"
          onClick={() => setDisplay(c)}
          className={cn(
            "h-7 px-3 rounded-sm font-mono text-xs",
            display === c ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          {c === "NGN" ? "₦ NGN" : "$ USD"}
        </Button>
      ))}
    </div>
  );
}
