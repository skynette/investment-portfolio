"use server";

import { prisma } from "@/server/lib/db";
import { revalidatePath } from "next/cache";

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

export async function createCategory(input: {
  name: string;
  currency?: string;
  defaultMonthlyTarget?: number;
  /** If provided, also creates a MonthlyEntry for this month using the default target. */
  addToMonth?: { year: number; month: number };
}) {
  const target = input.defaultMonthlyTarget ?? 0;
  const created = await prisma.category.create({
    data: {
      name: input.name.trim(),
      currency: input.currency ?? "NGN",
      defaultMonthlyTarget: target,
    },
  });

  if (input.addToMonth) {
    await prisma.monthlyEntry.create({
      data: {
        categoryId: created.id,
        year: input.addToMonth.year,
        month: input.addToMonth.month,
        target,
        actual: 0,
      },
    });
  }

  revalidatePath("/monthly");
  revalidatePath("/");
  return created;
}

export async function updateCategory(
  id: number,
  input: { name?: string; defaultMonthlyTarget?: number; isActive?: boolean },
) {
  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.defaultMonthlyTarget !== undefined
        ? { defaultMonthlyTarget: input.defaultMonthlyTarget }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
  revalidatePath("/monthly");
  revalidatePath("/");
  return updated;
}

export async function deleteCategory(id: number) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/monthly");
  revalidatePath("/");
}
