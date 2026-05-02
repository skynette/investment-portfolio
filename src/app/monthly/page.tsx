import { getMonth } from "@/server/actions/monthly";
import { listCategories } from "@/server/actions/categories";
import { currentYearMonth } from "@/lib/dates";
import { MonthlyClient } from "@/components/monthly/MonthlyClient";

export default async function MonthlyPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const ym = sp.year && sp.month
    ? { year: Number(sp.year), month: Number(sp.month) }
    : currentYearMonth();

  const [rows, categories] = await Promise.all([
    getMonth(ym),
    listCategories(),
  ]);

  const presentIds = new Set(rows.map((r) => r.categoryId));
  const addable = categories.filter((c) => c.isActive && !presentIds.has(c.id));

  return <MonthlyClient
    initialYearMonth={ym}
    rows={rows.map((r) => ({
      id: r.id,
      categoryId: r.categoryId,
      target: Number(r.target),
      actual: Number(r.actual),
      note: r.note,
      category: { name: r.category.name, currency: r.category.currency },
    }))}
    categories={categories.map((c) => ({
      id: c.id,
      name: c.name,
      currency: c.currency,
      defaultMonthlyTarget: Number(c.defaultMonthlyTarget),
      isActive: c.isActive,
    }))}
    addableCategories={addable.map((c) => ({
      id: c.id,
      name: c.name,
      currency: c.currency,
      defaultMonthlyTarget: Number(c.defaultMonthlyTarget),
      isActive: c.isActive,
    }))}
  />;
}
