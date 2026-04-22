"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SpendingChartProps {
  data: { month: string; amount: number }[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#44474e" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: "#ffffff",
            border: "none",
            borderRadius: "0.75rem",
            fontSize: 12,
            boxShadow: "0 4px 24px rgba(26,27,30,0.06)",
          }}
          formatter={(v) =>
            Number(v).toLocaleString("en-US", { style: "currency", currency: "USD" })
          }
        />
        <Bar dataKey="amount" fill="#002046" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
