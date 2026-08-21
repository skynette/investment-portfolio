import { describe, it, expect } from "vitest";
import { parseTransactionsCsv, CUTOFF } from "@/server/lib/csv-parser";

const HEADER = `Date (UTC+1:00),Token,Type,Price (USD),Amount,Total value (USD),Fee,Fee Currency,Notes`;

// Fixtures use invented tickers and amounts on purpose — never paste real
// portfolio rows in here, the repo is public.

describe("parseTransactionsCsv", () => {
  it("parses a single buy", () => {
    const csv = HEADER + "\n" + `"2026-04-02 14:50:00","TKNA","buy","12.50","2.0000","25.00","0.","USD",""`;
    const rows = parseTransactionsCsv(csv);
    expect(rows.length).toBe(1);
    const r = rows[0];
    expect(r.symbol).toBe("TKNA");
    expect(r.type).toBe("buy");
    expect(r.pricePerUnit).toBe(12.5);
    expect(r.amount).toBe(2);
    expect(r.totalUsd).toBe(25);
    expect(r.occurredAt.toISOString()).toBe("2026-04-02T13:50:00.000Z");
  });

  it("strips thousands separators in amount", () => {
    const csv = HEADER + "\n" +
      `"2026-01-06 13:30:00","TKNB","buy","0.00002000","2,500,000.50","50.00","0.","USD",""`;
    const rows = parseTransactionsCsv(csv);
    expect(rows[0].amount).toBeCloseTo(2500000.5);
  });

  it("filters rows before cutoff", () => {
    expect(CUTOFF.toISOString()).toBe("2025-05-19T10:20:00.000Z");
    const csv = HEADER + "\n" +
      `"2024-04-25 08:30:00","MOJO","sell","0.1099","30.20","3.3193","0.3","USD",""\n` +
      `"2025-05-19 11:20:00","TKNC","buy","0.5000","10.0000","5.00","--","",""`;
    const rows = parseTransactionsCsv(csv);
    expect(rows.length).toBe(1);
    expect(rows[0].symbol).toBe("TKNC");
  });

  it("handles transferIn (no price/total)", () => {
    const csv = HEADER + "\n" +
      `"2026-01-06 13:30:00","FOO","transferIn","--","100","--","--","",""`;
    const rows = parseTransactionsCsv(csv);
    expect(rows[0].pricePerUnit).toBeNull();
    expect(rows[0].totalUsd).toBeNull();
    expect(rows[0].amount).toBe(100);
  });

  it("handles empty fee field", () => {
    const csv = HEADER + "\n" +
      `"2026-04-02 14:50:00","TKNA","buy","12.50","2.0000","25.00","--","",""`;
    const rows = parseTransactionsCsv(csv);
    expect(rows[0].fee).toBeNull();
  });
});
