"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MonthSelector } from "@/components/monthly/MonthSelector";
import type { YearMonth } from "@/lib/dates";

export function DashboardMonthSelector({ value }: { value: YearMonth }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  return (
    <MonthSelector
      value={value}
      onChange={(ym) => startTransition(() => router.push(`/?year=${ym.year}&month=${ym.month}`))}
    />
  );
}
