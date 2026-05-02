import { listAssets } from "@/server/actions/assets";
import { listTransactions } from "@/server/actions/transactions";
import { computeHolding } from "@/server/lib/holdings";
import { fetchPrices } from "@/server/lib/cmc";
import { CryptoClient } from "@/components/crypto/CryptoClient";

export default async function CryptoPage() {
  const [assets, txs] = await Promise.all([listAssets(), listTransactions()]);

  const txsByAsset = new Map<number, typeof txs>();
  for (const t of txs) {
    const arr = txsByAsset.get(t.assetId) ?? [];
    arr.push(t);
    txsByAsset.set(t.assetId, arr);
  }

  const holdings = assets
    .map((a) => {
      const assetTxs = (txsByAsset.get(a.id) ?? []).map((t) => ({
        type: t.type as "buy" | "sell" | "transferIn" | "transferOut",
        amount: Number(t.amount),
        totalUsd: t.totalUsd === null ? null : Number(t.totalUsd),
      }));
      const h = computeHolding(assetTxs);
      return { asset: a, holding: h };
    })
    .filter(({ holding }) => holding.amount > 0);

  const symbols = holdings.map(({ asset }) => asset.cmcSymbol);
  const prices = await fetchPrices(symbols);

  let valueUsd = 0;
  let costUsd = 0;
  for (const { asset, holding } of holdings) {
    costUsd += holding.costBasis;
    const live = prices[asset.cmcSymbol];
    if (live) valueUsd += holding.amount * live.price;
  }
  const plUsd = valueUsd - costUsd;
  const plPct = costUsd > 0 ? plUsd / costUsd : 0;

  const txData = txs.map((t) => ({
    id: t.id,
    occurredAt: t.occurredAt.toISOString(),
    type: t.type,
    symbol: t.asset.symbol,
    name: t.asset.name,
    assetId: t.assetId,
    amount: Number(t.amount),
    pricePerUnit: t.pricePerUnit === null ? null : Number(t.pricePerUnit),
    totalUsd: t.totalUsd === null ? null : Number(t.totalUsd),
    note: t.note,
  }));

  return <CryptoClient
    holdings={holdings.map(({ asset, holding }) => ({
      assetId: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      cmcSymbol: asset.cmcSymbol,
      amount: holding.amount,
      costBasis: holding.costBasis,
      avgCost: holding.avgCost,
    }))}
    transactions={txData}
    assets={assets.map((a) => ({ id: a.id, symbol: a.symbol, name: a.name }))}
    summary={{ valueUsd, costUsd, plUsd, plPct, txCount: txs.length }}
  />;
}
