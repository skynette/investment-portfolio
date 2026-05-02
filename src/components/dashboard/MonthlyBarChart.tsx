"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function MonthlyBarChart({ data }: { data: { name: string; target: number; actual: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No categories yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4} barCategoryGap={32}>
        <defs>
          <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10d987" stopOpacity={1} />
            <stop offset="100%" stopColor="#10d987" stopOpacity={0.55} />
          </linearGradient>
          <linearGradient id="targetFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#475569" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#475569" stopOpacity={0.35} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
        <XAxis dataKey="name" stroke="rgba(148,163,184,0.7)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="rgba(148,163,184,0.7)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : String(v)}
        />
        <Tooltip
          formatter={(v) => `₦${Number(v ?? 0).toLocaleString()}`}
          contentStyle={{
            backgroundColor: "rgb(15 23 42 / 0.95)",
            border: "1px solid rgb(51 65 85)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar dataKey="target" fill="url(#targetFill)" name="Target" radius={[6, 6, 0, 0]} />
        <Bar dataKey="actual" fill="url(#actualFill)" name="Actual" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
