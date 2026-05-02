import { describe, it, expect } from "vitest";
import { formatMoney, formatCompactMoney, formatPercent } from "@/lib/format";

describe("formatMoney", () => {
  it("formats NGN", () => {
    expect(formatMoney(150000, "NGN")).toBe("₦150,000.00");
  });

  it("formats USD", () => {
    expect(formatMoney(216.5, "USD")).toBe("$216.50");
  });

  it("handles small USD values", () => {
    expect(formatMoney(0.18, "USD")).toBe("$0.18");
  });

  it("formats negative as -$X.XX (not $-X.XX)", () => {
    expect(formatMoney(-216.5, "USD")).toBe("-$216.50");
  });

  it("formats negative NGN", () => {
    expect(formatMoney(-150000, "NGN")).toBe("-₦150,000.00");
  });
});

describe("formatCompactMoney", () => {
  it("compacts NGN to k", () => {
    expect(formatCompactMoney(150000, "NGN")).toBe("₦150k");
  });

  it("compacts USD over 1000", () => {
    expect(formatCompactMoney(2500, "USD")).toBe("$2.5k");
  });

  it("doesn't compact small USD", () => {
    expect(formatCompactMoney(216, "USD")).toBe("$216");
  });
});

describe("formatPercent", () => {
  it("formats positive", () => {
    expect(formatPercent(0.123)).toBe("12.3%");
  });

  it("formats negative", () => {
    expect(formatPercent(-0.05)).toBe("-5.0%");
  });
});
