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
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={() => onChange(previousMonth(value))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[140px] text-center text-lg font-medium">
        {formatYearMonth(value)}
      </span>
      <Button variant="ghost" size="icon" onClick={() => onChange(nextMonth(value))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
