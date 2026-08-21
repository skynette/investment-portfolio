# Investment Portfolio

A self-hosted, single-user investment tracker for **monthly contributions** (in any local currency) and **crypto holdings** (with live prices and P/L). Deployed on Vercel, stores data in Neon Postgres, and uses CoinMarketCap for live crypto prices.

> Single-user. No accounts, no telemetry. Your data lives in your own Neon database.

---

## Highlights

- **Monthly investments**: track multiple categories (US stocks, local equities, mutual funds, etc.) with monthly targets and actuals. New months auto-roll forward with the previous month's targets.
- **Crypto holdings**: per-asset cards with live price, 24h/7d %, P/L. Built on a transaction log so cost basis is always correct.
- **CSV import**: drag-drop a transactions CSV (or seed at install time). Duplicates are de-duped by (asset, time, type, amount, total).
- **CSV export**: monthly entries and crypto transactions, both exportable.
- **Currency toggle**: switch the entire UI between NGN and USD. FX rate auto-refreshed hourly.
- **Dashboard**: per-month KPIs, total committed across both portfolios, target-vs-actual chart, best/worst crypto performers, recent activity feed.
- **Dark mode by default.**

## Tech stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**
- **Prisma 7** + **Neon Postgres** via `@prisma/adapter-pg`
- **shadcn/ui** components (built on `@base-ui/react`) + **Tailwind CSS 4**
- **Recharts** for charts
- **Vitest** for unit tests
- **CoinMarketCap Pro API** (free tier) for live prices
- **open.er-api.com** (no key) for FX, configurable

## Quick start

Requires Node.js 20+ and npm.

```bash
git clone <your-repo-url>
cd investment-porfolio
npm install
cp .env.example .env             # then edit .env with your CMC API key
npx prisma migrate deploy
npx prisma generate
npx tsx prisma/seed.ts           # creates 3 example categories with default targets
npm run dev                      # http://localhost:3000
```

Get a free CoinMarketCap API key at <https://pro.coinmarketcap.com/signup>. Free tier gives 10,000 calls/month, more than enough for personal use.

### Importing your crypto history

The app's `/crypto → Import CSV` button accepts a CSV in this header format:

```
Date (UTC+1:00),Token,Type,Price (USD),Amount,Total value (USD),Fee,Fee Currency,Notes
```

Most portfolio trackers (CoinStats, CoinGecko, etc.) export in this shape or near it. To bulk-import via CLI instead:

```bash
# put your CSV at data/transactions.csv, or set CRYPTO_CSV env var
mkdir -p data && cp /path/to/your.csv data/transactions.csv
npx tsx prisma/seed-crypto.ts
```

To **update** an existing portfolio from a fresh CoinMarketCap export instead of
seeding a fresh one, use the reconciler — it adds only the transactions you don't
already have:

```bash
npm run db:reconcile:cmc -- /path/to/Joshua_transactions.csv          # dry run
npm run db:reconcile:cmc -- /path/to/Joshua_transactions.csv --apply  # write
```

It matches a trade on `(symbol, type, amount, totalUsd)` within a 3-day window
rather than on the exact timestamp. CMC records the *trade* time while rows you
entered by hand carry the time you entered them, so timestamp matching reports
trades you already own as new and doubles your holdings.

The parser filters transactions older than `2025-05-19 11:20 UTC+1` by default. Edit `CUTOFF` in `src/server/lib/csv-parser.ts` if you want a different cutoff or none at all.

## Where is my data?

Everything lives in your **Neon Postgres** database. Neon keeps automatic
point-in-time history, and you can branch or export from the Neon console.

`DATABASE_URL` must be Neon's **pooled** endpoint (the `-pooler` host) — that is
what the app reads at runtime. `DIRECT_URL` must be the **direct** endpoint (no
`-pooler`) and is used only by `prisma migrate`.

> These are also set as Vercel environment variables for Production and Preview.
> Changing `.env` alone does not affect the deployed site — update both, then redeploy.

Other local-only files (gitignored):
- `.env` — your CMC API key and database URLs
- `data/` — CSV imports
- `prisma/seed.personal.ts` — your custom seed if you write one
- `*.private.csv` — any CSV you mark private

## Backups

```bash
npm run db:backup                                            # -> backups/backup-<timestamp>.json
npm run db:restore -- backups/backup-<stamp>.json            # dry run
npm run db:restore -- backups/backup-<stamp>.json --apply    # DESTRUCTIVE
```

Backups are plain JSON and need no `pg_dump`, so there is no client/server
version to match. `numeric` columns are kept as strings so crypto amounts keep
full precision. `backups/` is gitignored — these files hold your real portfolio,
so keep them off the public repo.

Row data only, not schema. To rebuild from scratch: create the database, run
`prisma migrate deploy`, then restore. `--apply` truncates every table first and
runs inside a single transaction, so a failure part-way rolls back rather than
leaving a half-restored database.

## Configuration

`.env` keys:

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | yes | — | Neon **pooled** connection string (`-pooler` host) |
| `DIRECT_URL` | yes | — | Neon **direct** connection string, for `prisma migrate` |
| `CMC_API_KEY` | for live prices | — | CoinMarketCap Pro API key |
| `FX_API_URL` | no | `https://open.er-api.com/v6/latest/USD` | Any endpoint returning `{rates: {NGN: number}}` |
| `NEXT_DEV_ORIGINS` | no | — | Comma-separated LAN IPs allowed to access `next dev` (needed when using your phone on the same WiFi or hotspot). Find yours with `ipconfig getifaddr en0`. |

## Customising for a different base currency

The codebase ships with NGN as the data-entry currency for monthly investments. To use a different one (EUR, GBP, etc.):

1. Update default categories in `prisma/seed.ts` — set `currency: "EUR"` (or whatever).
2. Update the FX endpoint in `.env` if needed.
3. Update `Currency` type in `src/lib/format.ts` to include your currency code, and add its symbol to `SYMBOLS`.
4. Update `convert()` in `src/components/layout/CurrencyContext.tsx` for the new pair.

## Repository layout

```
prisma/
  schema.prisma             # data model: Category, MonthlyEntry, CryptoAsset,
                            #             CryptoTransaction, FxRate, Setting
  migrations/
  seed.ts                   # default seed: 3 example categories, no entries
  seed-crypto.ts            # imports a CSV from ./data/transactions.csv
src/
  app/
    page.tsx                # Dashboard
    monthly/page.tsx        # Monthly investments
    crypto/page.tsx         # Crypto holdings + transactions
    settings/page.tsx       # Env info + DB wipe
    api/prices/route.ts     # GET /api/prices?symbols=SOL,JUP,…
  components/
    dashboard/              # KPI cards, charts, performer cards, assets table
    monthly/                # Table, month selector, category manager, etc.
    crypto/                 # Holdings grid, transaction table, dialogs
    layout/                 # Sidebar, theme + currency toggles, providers
    settings/
    ui/                     # shadcn-generated primitives
  server/
    actions/                # Server Actions (categories, monthly, assets,
                            #                  transactions, settings, export)
    lib/
      db.ts                 # Prisma client singleton (adapter-based)
      cmc.ts                # CoinMarketCap fetch + 60s memory cache
      fx.ts                 # USD↔NGN fetch + 1h DB cache
      holdings.ts           # Pure derivation: txs → {amount, costBasis, avgCost}
      csv-parser.ts         # Pure parser for transaction CSVs
  lib/
    dates.ts                # YearMonth utilities
    format.ts               # Money + percent formatters
  tests/                    # Vitest unit tests for pure logic
```

## Architecture notes

- **No separate API layer.** Reads happen in Server Components; writes happen via Next.js Server Actions. The only HTTP endpoint is `/api/prices` because the holdings cards refresh prices client-side.
- **Holdings are derived, not stored.** `computeHolding(transactions)` is the source of truth. This means edits to history always recompute correctly.
- **Idempotent CSV import.** A unique constraint on `(assetId, occurredAt, type, amount, totalUsd)` skips duplicates silently — re-importing the same CSV is safe.
- **Two-tier price caching.** CoinMarketCap responses are cached in-memory for 60 seconds (server-side). FX rates are cached in the DB for 1 hour and refreshed on dashboard load.
- **Currency display ≠ storage.** Monthly entries are stored in their declared currency. Crypto values are stored in USD. The `<MoneyDisplay>` component converts on the fly using the FX rate; editing a value reverts to native currency to avoid round-trip precision loss.

## Development

```bash
npm test                  # vitest, ~30+ tests on pure logic
npm run test:watch
npm run build             # production build + type-check
```

Tests cover: holdings derivation, CSV parsing (with cutoff), date utilities, money formatting, CoinMarketCap cache behaviour, FX cache and fallback.

### Adding a new dashboard widget

1. Build it as a client component under `src/components/dashboard/`.
2. Compute its data server-side in `src/app/page.tsx` and pass via props.
3. If it shows money, use `<MoneyDisplay amount={x} from="USD" />` so the currency toggle works automatically.

### Adding a new crypto exchange CSV format

The current parser expects the CoinStats-style header. To support a new format:

1. Read 5–10 sample lines.
2. Add a new parser function in `src/server/lib/csv-parser.ts` returning `ParsedTx[]`.
3. Either dispatch by inspecting the header line, or add a UI selector for parser type.

## For AI coding agents

Key conventions you should respect when editing this codebase:

- **All money is rendered through `<MoneyDisplay>`.** Don't import `formatMoney` directly into components — that bypasses the global currency toggle. The exception is purely numeric formatting that shouldn't be currency-converted (chart axis labels, etc.).
- **Server Actions only.** Don't add API routes for DB writes; use Server Actions in `src/server/actions/`. The single HTTP route (`/api/prices`) exists because the client polls it, not because we want a REST layer.
- **Holdings are computed, not stored.** Never add a `holdings` table. Always derive from `CryptoTransaction` via `computeHolding()`.
- **Edit-mode reverts to native currency.** When making cells editable and the underlying data is currency-typed, the input should show the native currency (with a small label hint), not the user's display currency. See `MonthlyTable.tsx` for the pattern.
- **Pure-logic files have tests.** If you change `holdings.ts`, `csv-parser.ts`, `cmc.ts`, `fx.ts`, `dates.ts`, or `format.ts`, update the corresponding `*.test.ts` in `src/tests/` first (TDD), then the implementation.
- **Currency conversion happens in one place.** `convert(amount, from, to, fxRate)` in `CurrencyContext.tsx`. Don't reinvent it elsewhere.
- **Prisma client is at `@/generated/prisma/client`**, not `@prisma/client`. The schema uses Prisma 7's new `prisma-client` generator with output to `src/generated/prisma`.
- **Decimal columns come back from Prisma as `Decimal` objects.** Always wrap with `Number(x)` before doing math: `Number(row.actual)`, not `row.actual`.
- **No CSS-in-JS, no styled-components.** Tailwind utility classes only. Use `cn()` from `@/lib/utils` to compose.
- **shadcn 4.6 uses `@base-ui/react`, not Radix.** `asChild` doesn't exist on triggers; use `render={<Component />}` instead.
- **The seed must stay generic.** `prisma/seed.ts` is committed and must not contain personal data. Personal seeds belong in `prisma/seed.personal.ts` (gitignored).

## Security

- The CMC API key lives only in `.env` (gitignored). Don't commit it.
- The app binds to `localhost` by default. Don't expose it to the internet without adding auth — there isn't any.
- Re-importing your CSV is safe but irreversible if you've edited rows in the meantime; export a backup first.

## Licence

MIT.
