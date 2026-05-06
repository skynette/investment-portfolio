import { describe, it, expect } from "vitest";
import { previousMonth, nextMonth, currentYearMonth, formatActivityDateTime } from "@/lib/dates";

describe("dates", () => {
  it("previousMonth wraps year boundary", () => {
    expect(previousMonth({ year: 2026, month: 1 })).toEqual({ year: 2025, month: 12 });
  });

  it("previousMonth within same year", () => {
    expect(previousMonth({ year: 2026, month: 5 })).toEqual({ year: 2026, month: 4 });
  });

  it("nextMonth wraps year boundary", () => {
    expect(nextMonth({ year: 2026, month: 12 })).toEqual({ year: 2027, month: 1 });
  });

  it("currentYearMonth returns correct shape", () => {
    const ym = currentYearMonth();
    expect(ym.year).toBeGreaterThanOrEqual(2026);
    expect(ym.month).toBeGreaterThanOrEqual(1);
    expect(ym.month).toBeLessThanOrEqual(12);
  });

  it("formats activity timestamps deterministically", () => {
    expect(formatActivityDateTime("2026-05-06T16:04:02.000Z")).toBe("06/05/2026, 17:04:02");
  });
});
