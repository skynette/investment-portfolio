import { prisma } from "@/server/lib/db";

const TTL_MS = 60 * 60 * 1000; // 1 hour

type Fetcher = () => Promise<number>;

let fetcher: Fetcher = defaultFetcher;

export function __setFxFetcher(f: Fetcher) {
  fetcher = f;
}

export function __resetFxState() {
  fetcher = defaultFetcher;
}

async function defaultFetcher(): Promise<number> {
  const url = process.env.FX_API_URL ?? "https://open.er-api.com/v6/latest/USD";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
  const json = await res.json();
  const rate = json?.rates?.NGN;
  if (typeof rate !== "number") throw new Error("FX response missing NGN");
  return rate;
}

export async function getUsdToNgn(): Promise<number | null> {
  const latest = await prisma.fxRate.findFirst({
    where: { base: "USD", quote: "NGN" },
    orderBy: { fetchedAt: "desc" },
  });

  const fresh = latest && Date.now() - new Date(latest.fetchedAt).getTime() < TTL_MS;
  if (fresh) return Number(latest.rate);

  try {
    const rate = await fetcher();
    await prisma.fxRate.create({ data: { base: "USD", quote: "NGN", rate } });
    return rate;
  } catch (e) {
    console.error("FX fetch failed:", e);
    return latest ? Number(latest.rate) : null;
  }
}
