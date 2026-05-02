"use server";

import { prisma } from "@/server/lib/db";
import { revalidatePath } from "next/cache";

export async function listAssets() {
  return prisma.cryptoAsset.findMany({ orderBy: { symbol: "asc" } });
}

export async function upsertAsset(input: {
  symbol: string;
  name: string;
  cmcSymbol?: string;
}) {
  const symbol = input.symbol.toUpperCase();
  const asset = await prisma.cryptoAsset.upsert({
    where: { symbol },
    update: { name: input.name, cmcSymbol: input.cmcSymbol ?? symbol },
    create: { symbol, name: input.name, cmcSymbol: input.cmcSymbol ?? symbol },
  });
  revalidatePath("/crypto");
  revalidatePath("/");
  return asset;
}

export async function setAssetActive(id: number, isActive: boolean) {
  await prisma.cryptoAsset.update({ where: { id }, data: { isActive } });
  revalidatePath("/crypto");
}
