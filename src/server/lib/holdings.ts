export type RawTx = {
  type: "buy" | "sell" | "transferIn" | "transferOut";
  amount: number;
  totalUsd: number | null;
};

export type Holding = {
  amount: number;
  costBasis: number;
  avgCost: number;
};

export function computeHolding(txs: RawTx[]): Holding {
  let amount = 0;
  let costBasis = 0;
  let buyAmount = 0;

  for (const t of txs) {
    const a = Number(t.amount);
    switch (t.type) {
      case "buy":
        amount += a;
        costBasis += Number(t.totalUsd ?? 0);
        buyAmount += a;
        break;
      case "sell":
        amount -= a;
        break;
      case "transferIn":
        amount += a;
        break;
      case "transferOut":
        amount -= a;
        break;
    }
  }

  const avgCost = buyAmount > 0 ? costBasis / buyAmount : 0;
  return { amount, costBasis, avgCost };
}
