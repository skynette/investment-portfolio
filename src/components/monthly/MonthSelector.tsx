"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { previousMonth, nextMonth, formatYearMonth, type YearMonth } from "@/lib/dates";

export function MonthSelector({
  value,
  onChange,
}: {
  value: YearMonth;
  onChange: (next: YearMonth) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border bg-background/40">
      <Button
        variant="ghost"
        onClick={() => onChange(previousMonth(value))}
        className="h-11 w-11 p-0"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <span className="min-w-[140px] px-2 text-center text-base font-medium">
        {formatYearMonth(value)}
      </span>
      <Button
        variant="ghost"
        onClick={() => onChange(nextMonth(value))}
        className="h-11 w-11 p-0"
        aria-label="Next month"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
