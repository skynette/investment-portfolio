import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchPrices, __resetCache } from "@/server/lib/cmc";

const sample = {
  data: {
    SOL: [{
      symbol: "SOL",
      quote: { USD: { price: 100, percent_change_1h: 0.5, percent_change_24h: 1.5, percent_change_7d: -2.5 } },
    }],
  },
};

describe("CMC cache", () => {
  beforeEach(() => {
    __resetCache();
    vi.restoreAllMocks();
    process.env.CMC_API_KEY = "test-key";
  });

  it("calls fetch once for two requests within 60s", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(sample), { status: 200 }),
    );

    await fetchPrices(["SOL"]);
    await fetchPrices(["SOL"]);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("returns price + 1h/24h/7d on second call", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(sample), { status: 200 }),
    );

    const first = await fetchPrices(["SOL"]);
    const second = await fetchPrices(["SOL"]);

    expect(first.SOL.price).toBe(100);
    expect(first.SOL.change1h).toBe(0.5);
    expect(first.SOL.change24h).toBe(1.5);
    expect(first.SOL.change7d).toBe(-2.5);
    expect(second.SOL).toEqual(first.SOL);
  });

  it("returns empty object on fetch error and does not cache failure", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network down"));
    const result = await fetchPrices(["SOL"]);
    expect(result).toEqual({});
  });
});
