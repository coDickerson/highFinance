"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type DeptMeta = { id: string; name: string; colorHex: string };

interface StackedSpendingChartProps {
  data: Record<string, string | number>[];
  departments: DeptMeta[];
}

export function StackedSpendingChart({ data, departments }: StackedSpendingChartProps) {
  if (departments.length === 0) {
    return (
      <p className="text-[var(--color-on-surface-variant)] text-sm text-center py-10">
        No spending data yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#ffffff60" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: "#111111",
            border: "none",
            borderRadius: "0.75rem",
            fontSize: 12,
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
            color: "#ffffff",
          }}
          formatter={(v, name) => [
            Number(v).toLocaleString("en-US", { style: "currency", currency: "USD" }),
            departments.find((d) => d.id === name)?.name ?? name,
          ]}
        />
        <Legend
          formatter={(value) => departments.find((d) => d.id === value)?.name ?? value}
          wrapperStyle={{ fontSize: 11 }}
        />
        {departments.map((dept, i) => (
          <Bar
            key={dept.id}
            dataKey={dept.id}
            stackId="a"
            fill={dept.colorHex}
            radius={i === departments.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
