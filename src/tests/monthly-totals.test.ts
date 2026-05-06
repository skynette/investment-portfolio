import { describe, it, expect } from "vitest";
import { summarizeMoneyTotal, summarizeProgress } from "@/lib/monthly-totals";

describe("summarizeMoneyTotal", () => {
  it("keeps same-currency totals in native currency when FX is unavailable", () => {
    expect(summarizeMoneyTotal([
      { amount: 100, currency: "USD" },
      { amount: 50, currency: "USD" },
    ], "NGN", null)).toEqual({
      amount: 150,
      currency: "USD",
      canDisplay: true,
    });
  });

  it("converts mixed-currency totals into the display currency when FX is available", () => {
    expect(summarizeMoneyTotal([
      { amount: 1500, currency: "NGN" },
      { amount: 2, currency: "USD" },
    ], "USD", 1500)).toEqual({
      amount: 3,
      currency: "USD",
      canDisplay: true,
    });
  });

  it("refuses to total mixed currencies without an FX rate", () => {
    expect(summarizeMoneyTotal([
      { amount: 1500, currency: "NGN" },
      { amount: 2, currency: "USD" },
    ], "USD", null)).toEqual({
      amount: null,
      currency: null,
      canDisplay: false,
    });
  });
});

describe("summarizeProgress", () => {
  it("computes progress after converting totals into a common display currency", () => {
    expect(summarizeProgress([
      { target: 3000, actual: 1500, currency: "NGN" },
      { target: 2, actual: 1, currency: "USD" },
    ], "USD", 1500)).toBeCloseTo(0.5);
  });

  it("returns null progress when mixed currencies cannot be normalized", () => {
    expect(summarizeProgress([
      { target: 3000, actual: 1500, currency: "NGN" },
      { target: 2, actual: 1, currency: "USD" },
    ], "USD", null)).toBeNull();
  });
});
