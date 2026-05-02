import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    fxRate: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/server/lib/db", () => ({ prisma: mocks.prisma }));

import { __setFxFetcher, getUsdToNgn, __resetFxState } from "@/server/lib/fx";

beforeEach(() => {
  __resetFxState();
  vi.clearAllMocks();
});

describe("getUsdToNgn", () => {
  it("returns cached rate if fresh (<1hr old)", async () => {
    mocks.prisma.fxRate.findFirst.mockResolvedValue({
      id: 1, base: "USD", quote: "NGN", rate: 1500, fetchedAt: new Date(),
    });

    const fetcher = vi.fn();
    __setFxFetcher(fetcher);

    const r = await getUsdToNgn();
    expect(r).toBe(1500);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("re-fetches if cached rate is older than 1hr", async () => {
    const stale = new Date(Date.now() - 1000 * 60 * 61);
    mocks.prisma.fxRate.findFirst.mockResolvedValue({
      id: 1, base: "USD", quote: "NGN", rate: 1500, fetchedAt: stale,
    });
    mocks.prisma.fxRate.create.mockResolvedValue({});

    const fetcher = vi.fn().mockResolvedValue(1600);
    __setFxFetcher(fetcher);

    const r = await getUsdToNgn();
    expect(r).toBe(1600);
    expect(fetcher).toHaveBeenCalled();
  });

  it("returns last cached value if fetch fails", async () => {
    const stale = new Date(Date.now() - 1000 * 60 * 61);
    mocks.prisma.fxRate.findFirst.mockResolvedValue({
      id: 1, base: "USD", quote: "NGN", rate: 1500, fetchedAt: stale,
    });

    const fetcher = vi.fn().mockRejectedValue(new Error("down"));
    __setFxFetcher(fetcher);

    const r = await getUsdToNgn();
    expect(r).toBe(1500);
  });

  it("returns null if no cached and fetch fails", async () => {
    mocks.prisma.fxRate.findFirst.mockResolvedValue(null);

    const fetcher = vi.fn().mockRejectedValue(new Error("down"));
    __setFxFetcher(fetcher);

    const r = await getUsdToNgn();
    expect(r).toBeNull();
  });
});
