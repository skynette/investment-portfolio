export type ParsedTx = {
  occurredAt: Date;
  symbol: string;
  type: "buy" | "sell" | "transferIn" | "transferOut";
  pricePerUnit: number | null;
  amount: number;
  totalUsd: number | null;
  fee: number | null;
  feeCurrency: string | null;
  note: string | null;
};

// Active cutoff: 2025-05-19 11:20 in UTC+1 = 2025-05-19T10:20:00Z
export const CUTOFF = new Date("2025-05-19T10:20:00.000Z");

const VALID_TYPES = new Set(["buy", "sell", "transferIn", "transferOut"]);

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function parseNumber(raw: string): number | null {
  const s = raw.replace(/,/g, "").trim();
  if (s === "" || s === "--" || s === "-" || s === ".") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseDateUtcPlus1(raw: string): Date {
  const [datePart, timePart] = raw.split(" ");
  const iso = `${datePart}T${timePart}+01:00`;
  return new Date(iso);
}

export function parseTransactionsCsv(csv: string): ParsedTx[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const result: ParsedTx[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]).map((c) => c.replace(/^"|"$/g, ""));
    if (cols.length < 9) continue;

    const [dateRaw, token, typeRaw, priceRaw, amountRaw, totalRaw, feeRaw, feeCurrency, note] = cols;
    if (!VALID_TYPES.has(typeRaw)) continue;

    const occurredAt = parseDateUtcPlus1(dateRaw);
    if (occurredAt < CUTOFF) continue;

    const amount = parseNumber(amountRaw);
    if (amount === null) continue;

    result.push({
      occurredAt,
      symbol: token.toUpperCase(),
      type: typeRaw as ParsedTx["type"],
      pricePerUnit: parseNumber(priceRaw),
      amount,
      totalUsd: parseNumber(totalRaw),
      fee: parseNumber(feeRaw),
      feeCurrency: feeCurrency.trim() || null,
      note: note.trim() || null,
    });
  }

  return result;
}
