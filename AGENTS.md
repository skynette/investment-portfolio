<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Investment Portfolio

A Next.js 16 + Prisma 7 + Neon Postgres single-user investment tracker deployed on Vercel. Read `README.md` first for the user-facing overview.

## Critical rules for any code change

1. **All currency-displayed amounts must use `<MoneyDisplay>`.** Direct calls to `formatMoney`/`formatCompactMoney` in UI components bypass the global NGN/USD toggle. Exception: chart axis labels (`tickFormatter`) where conversion would muddle the chart.
2. **DB writes go through Server Actions** in `src/server/actions/`, never via API routes. The lone API route (`/api/prices`) exists for client-side polling, not because we want a REST layer.
3. **Holdings are derived, never stored.** Use `computeHolding(transactions)` from `src/server/lib/holdings.ts`. Don't add a `holdings` table.
4. **Decimals from Prisma need `Number()` coercion** before math. `row.actual` is a `Decimal` object; `Number(row.actual)` is a JS number.
5. **Prisma client lives at `@/generated/prisma/client`**, not `@prisma/client`. Prisma 7 uses the new `prisma-client` generator.
6. **`prisma/seed.ts` is committed and must stay generic.** No personal financial data ever. Personal seeds go in `prisma/seed.personal.ts` (gitignored).
7. **shadcn here uses `@base-ui/react` (v4.6+), not Radix.** Triggers don't accept `asChild`; use `render={<Component />}` instead. See `AddTransactionDialog.tsx` for the pattern.
8. **Never match CMC transactions on `occurredAt`.** CMC exports the trade time; rows added through the app carry the entry time. The `tx_dedupe` constraint keys on `occurredAt`, so it will not catch these — match on `(symbol, type, amount, totalUsd)` within a time window instead. See `prisma/reconcile-cmc.ts`.
9. **TDD for pure-logic files.** `holdings.ts`, `csv-parser.ts`, `cmc.ts`, `fx.ts`, `dates.ts`, `format.ts` all have tests in `src/tests/`. Update tests first when changing behaviour.

## Directory map

| Path | Purpose |
|---|---|
| `prisma/schema.prisma` | 6 models: Category, MonthlyEntry, CryptoAsset, CryptoTransaction, FxRate, Setting |
| `prisma/seed.ts` | Generic seed (committed) |
| `prisma/seed-crypto.ts` | CSV import seed reading `data/transactions.csv` |
| `prisma/reconcile-cmc.ts` | Idempotent CMC-export sync; dry run by default, `--apply` to write |
| `src/app/` | App Router pages: `/` `/monthly` `/crypto` `/settings` `/api/prices` |
| `src/server/actions/` | Server Actions for all DB writes |
| `src/server/lib/db.ts` | Prisma client singleton (with `adapter-pg`) |
| `src/server/lib/holdings.ts` | Pure: `computeHolding(txs) → {amount, costBasis, avgCost}` |
| `src/server/lib/csv-parser.ts` | Pure: CSV → `ParsedTx[]`, with `CUTOFF` filter |
| `src/server/lib/cmc.ts` | CoinMarketCap client + 60s in-memory cache |
| `src/server/lib/fx.ts` | FX fetch + 1h DB cache, with injectable fetcher for tests |
| `src/components/layout/CurrencyContext.tsx` | Global NGN/USD toggle. `convert()` lives here. |
| `src/components/dashboard/MoneyDisplay.tsx` | Universal money component — use this everywhere |

## Editing workflow

1. **Identify the relevant pure-logic file**, if any. Update its test in `src/tests/` first.
2. **Run the test, watch it fail.** `npm test src/tests/foo.test.ts`
3. **Implement.** Re-run test until green.
4. **Touch the UI.** Server components fetch via `prisma`/server actions and pass plain serialisable data to client components.
5. **Type-check with `npm run build`.** Type errors are common around Recharts (`Tooltip formatter` value type), Base UI (no `asChild`, returns `string | null` from selects), and React 19 (`startTransition` requires `void` returns).

## Common gotchas

- **`startTransition(async () => { return toast.error("...") })`** breaks build under React 19. Wrap as `if (!ok) { toast.error("..."); return; }` instead.
- **Recharts `formatter={(v: number) => …}`** breaks under v3 strict types. Use `formatter={(v) => Number(v ?? 0).toFixed(2)}`.
- **Base UI `Select.onValueChange`** can return `null`; coerce with `(v) => setX(v ?? "default")`.
- **Two connection strings.** `DATABASE_URL` is Neon's pooled endpoint (`-pooler` host, app runtime); `DIRECT_URL` is the direct endpoint (`prisma migrate` only). The app reads `DATABASE_URL` and nothing else.
- **Vercel env vars are separate from `.env`.** Changing one does not change the other, and neither takes effect until a redeploy.
- **The currency provider is in the root layout.** It needs `fxRate` server-side at every navigation — don't move it to a page.
- **Editable cells must show native currency in edit mode**, otherwise typing a USD amount stores it as NGN. See `MonthlyTable.tsx`.

