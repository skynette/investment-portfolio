import { NextRequest, NextResponse } from "next/server";
import { fetchPrices } from "@/server/lib/cmc";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols");
  if (!symbols) return NextResponse.json({}, { status: 400 });

  const list = symbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  const data = await fetchPrices(list);
  return NextResponse.json(data);
}
