"use server";

import { prisma } from "@/server/lib/db";
import { revalidatePath } from "next/cache";
import { previousMonth, type YearMonth } from "@/lib/dates";

export async function getMonth({ year, month }: YearMonth) {
  let rows = await prisma.monthlyEntry.findMany({
    where: { year, month },
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });

  if (rows.length === 0) {
    const activeCategories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    if (activeCategories.length > 0) {
      const prev = previousMonth({ year, month });
      const prevRows = await prisma.monthlyEntry.findMany({
        where: { year: prev.year, month: prev.month },
      });
      const prevByCategory = new Map(prevRows.map((r) => [r.categoryId, r]));

      await prisma.$transaction(
        activeCategories.map((cat) =>
          prisma.monthlyEntry.create({
            data: {
              categoryId: cat.id,
              year,
              month,
              target: prevByCategory.get(cat.id)?.target ?? cat.defaultMonthlyTarget,
              actual: 0,
            },
          }),
        ),
      );

      rows = await prisma.monthlyEntry.findMany({
        where: { year, month },
        include: { category: true },
        orderBy: { category: { name: "asc" } },
      });
    }
  }

  return rows;
}

export async function updateMonthlyEntry(
  id: number,
  input: { target?: number; actual?: number; note?: string | null },
) {
  const updated = await prisma.monthlyEntry.update({
    where: { id },
    data: {
      ...(input.target !== undefined ? { target: input.target } : {}),
      ...(input.actual !== undefined ? { actual: input.actual } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
    },
  });
  revalidatePath("/monthly");
  revalidatePath("/");
  return updated;
}

export async function deleteMonthlyEntry(id: number) {
  await prisma.monthlyEntry.delete({ where: { id } });
  revalidatePath("/monthly");
  revalidatePath("/");
}

export async function addMonthlyEntry(input: {
  categoryId: number;
  year: number;
  month: number;
  target: number;
}) {
  const created = await prisma.monthlyEntry.create({
    data: {
      categoryId: input.categoryId,
      year: input.year,
      month: input.month,
      target: input.target,
      actual: 0,
    },
    include: { category: true },
  });
  revalidatePath("/monthly");
  revalidatePath("/");
  return created;
}
