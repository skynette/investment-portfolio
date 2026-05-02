import { describe, it, expect } from "vitest";
import { computeHolding, type RawTx } from "@/server/lib/holdings";

const tx = (over: Partial<RawTx>): RawTx => ({
  type: "buy", amount: 0, totalUsd: 0, ...over,
});

describe("computeHolding", () => {
  it("sums buys", () => {
    const h = computeHolding([
      tx({ type: "buy", amount: 1, totalUsd: 100 }),
      tx({ type: "buy", amount: 2, totalUsd: 180 }),
    ]);
    expect(h.amount).toBe(3);
    expect(h.costBasis).toBe(280);
    expect(h.avgCost).toBeCloseTo(280 / 3);
  });

  it("subtracts sells from amount but not from cost basis", () => {
    const h = computeHolding([
      tx({ type: "buy", amount: 2, totalUsd: 200 }),
      tx({ type: "sell", amount: 1, totalUsd: 150 }),
    ]);
    expect(h.amount).toBe(1);
    expect(h.costBasis).toBe(200);
    expect(h.avgCost).toBe(100);
  });

  it("transferIn adds to amount only", () => {
    const h = computeHolding([
      tx({ type: "transferIn", amount: 5, totalUsd: null }),
      tx({ type: "buy", amount: 1, totalUsd: 50 }),
    ]);
    expect(h.amount).toBe(6);
    expect(h.costBasis).toBe(50);
    expect(h.avgCost).toBe(50);
  });

  it("transferOut subtracts from amount only", () => {
    const h = computeHolding([
      tx({ type: "buy", amount: 3, totalUsd: 90 }),
      tx({ type: "transferOut", amount: 1, totalUsd: null }),
    ]);
    expect(h.amount).toBe(2);
    expect(h.costBasis).toBe(90);
  });

  it("returns zero on empty", () => {
    const h = computeHolding([]);
    expect(h.amount).toBe(0);
    expect(h.costBasis).toBe(0);
    expect(h.avgCost).toBe(0);
  });

  it("avgCost is 0 if no buys", () => {
    const h = computeHolding([tx({ type: "transferIn", amount: 5, totalUsd: null })]);
    expect(h.avgCost).toBe(0);
  });
});
