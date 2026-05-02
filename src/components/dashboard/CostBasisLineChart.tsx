"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function CostBasisLineChart({ data }: { data: { date: string; value: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No buy transactions yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" />
        <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
        <Tooltip formatter={(v) => `$${Number(v ?? 0).toFixed(2)}`} />
        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
