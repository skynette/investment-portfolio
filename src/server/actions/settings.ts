"use server";

import { prisma } from "@/server/lib/db";
import { revalidatePath } from "next/cache";

export async function getSetting(key: string): Promise<string | null> {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  revalidatePath("/settings");
}

export async function wipeDatabase() {
  await prisma.cryptoTransaction.deleteMany();
  await prisma.cryptoAsset.deleteMany();
  await prisma.monthlyEntry.deleteMany();
  await prisma.category.deleteMany();
  await prisma.fxRate.deleteMany();
  await prisma.setting.deleteMany();
  revalidatePath("/");
  revalidatePath("/monthly");
  revalidatePath("/crypto");
}
