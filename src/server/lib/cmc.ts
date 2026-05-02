export type Price = {
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
};

type CacheEntry = { at: number; data: Record<string, Price> };
let cache: CacheEntry | null = null;
const TTL_MS = 60_000;

export function __resetCache() {
  cache = null;
}

export async function fetchPrices(symbols: string[]): Promise<Record<string, Price>> {
  if (symbols.length === 0) return {};

  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) {
    const subset: Record<string, Price> = {};
    for (const s of symbols) {
      if (cache.data[s]) subset[s] = cache.data[s];
    }
    if (Object.keys(subset).length === symbols.length) return subset;
  }

  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) {
    console.error("CMC_API_KEY not set");
    return {};
  }

  const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(symbols.join(","))}&convert=USD`;
  try {
    const res = await fetch(url, {
      headers: { "X-CMC_PRO_API_KEY": apiKey, Accept: "application/json" },
    });
    if (!res.ok) {
      console.error("CMC fetch failed:", res.status, await res.text());
      return {};
    }
    const json = await res.json();
    const out: Record<string, Price> = {};
    for (const [symbol, arr] of Object.entries(json.data ?? {})) {
      const list = arr as Array<{ symbol: string; quote: { USD: { price: number; percent_change_1h: number; percent_change_24h: number; percent_change_7d: number } } }>;
      const first = list[0];
      if (first) {
        out[symbol] = {
          price: first.quote.USD.price,
          change1h: first.quote.USD.percent_change_1h,
          change24h: first.quote.USD.percent_change_24h,
          change7d: first.quote.USD.percent_change_7d,
        };
      }
    }
    cache = { at: now, data: out };
    return out;
  } catch (e) {
    console.error("CMC fetch threw:", e);
    return {};
  }
}
