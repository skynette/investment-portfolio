"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Wallet, Target, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MonthSelector } from "./MonthSelector";
import { MonthlyTable } from "./MonthlyTable";
import { CategoryManager } from "./CategoryManager";
import { AddRowMenu } from "./AddRowMenu";
import { MonthlyExportButton } from "./ExportButton";
import { formatPercent } from "@/lib/format";
import { MoneyDisplay, PrivateText } from "@/components/dashboard/MoneyDisplay";
import { formatYearMonth, type YearMonth } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Row = {
  id: number;
  categoryId: number;
  target: number;
  actual: number;
  note: string | null;
  category: { name: string; currency: string };
};

type Category = {
  id: number;
  name: string;
  currency: string;
  defaultMonthlyTarget: number;
  isActive: boolean;
};

export function MonthlyClient({
  initialYearMonth,
  rows,
  categories,
  addableCategories,
}: {
  initialYearMonth: YearMonth;
  rows: Row[];
  categories: Category[];
  addableCategories: Category[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const onChangeMonth = (ym: YearMonth) => {
    startTransition(() => {
      router.push(`/monthly?year=${ym.year}&month=${ym.month}`);
    });
  };

  const totalTarget = rows.reduce((s, r) => s + r.target, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const pct = totalTarget > 0 ? totalActual / totalTarget : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Monthly Investments</h2>
          <p className="text-sm text-muted-foreground">{formatYearMonth(initialYearMonth)}</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthSelector value={initialYearMonth} onChange={onChangeMonth} />
          <MonthlyExportButton />
          <AddRowMenu
            year={initialYearMonth.year}
            month={initialYearMonth.month}
            options={addableCategories.map((c) => ({
              id: c.id,
              name: c.name,
              defaultTarget: c.defaultMonthlyTarget,
            }))}
          />
          <CategoryManager categories={categories} currentMonth={initialYearMonth} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Invested this month"
          value={<MoneyDisplay amount={totalActual} from="NGN" compact className="text-3xl font-bold" />}
          icon={Wallet}
          accent="violet"
        />
        <SummaryCard
          label="Target"
          value={<MoneyDisplay amount={totalTarget} from="NGN" compact className="text-3xl font-bold" />}
          icon={Target}
          accent="amber"
        />
        <SummaryCard
          label="Progress"
          value={<PrivateText fallback="••%" className="text-3xl font-bold">{formatPercent(pct)}</PrivateText>}
          icon={TrendingUp}
          accent={pct >= 1 ? "green" : "amber"}
          progress={pct}
        />
      </div>

      <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur">
        <MonthlyTable rows={rows} />
      </Card>
    </div>
  );
}

function SummaryCard({
  label, value, icon: Icon, accent, progress,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  accent: "green" | "violet" | "amber" | "muted";
  progress?: number;
}) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur">
      <div className={cn(
        "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl opacity-30",
        accent === "green" && "bg-emerald-500",
        accent === "violet" && "bg-violet-500",
        accent === "amber" && "bg-amber-500",
        accent === "muted" && "bg-slate-500",
      )} />
      <CardContent className="relative space-y-2 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>{value}</div>
        {progress !== undefined && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progress >= 1 ? "bg-emerald-500" : "bg-amber-500",
              )}
              style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
