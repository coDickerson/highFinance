"use client";

import { useState } from "react";
import { SpendingChart } from "@/components/ui/SpendingChart";
import Link from "next/link";

type MonthData = { month: string; amount: number };

const QUARTER_MAP: Record<string, string> = {
  JAN: "Q1", FEB: "Q1", MAR: "Q1",
  APR: "Q2", MAY: "Q2", JUN: "Q2",
  JUL: "Q3", AUG: "Q3", SEP: "Q3",
  OCT: "Q4", NOV: "Q4", DEC: "Q4",
};

export function SpendingToggleChart({ data }: { data: MonthData[] }) {
  const [view, setView] = useState<"Monthly" | "Quarterly">("Monthly");

  const chartData =
    view === "Monthly"
      ? data
      : Object.entries(
          data.reduce(
            (acc, { month, amount }) => {
              const q = QUARTER_MAP[month] ?? month;
              acc[q] = (acc[q] ?? 0) + amount;
              return acc;
            },
            {} as Record<string, number>
          )
        ).map(([month, amount]) => ({ month, amount }));

  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-[var(--color-on-surface)]">
          Spending Trends
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {(["Monthly", "Quarterly"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  view === v
                    ? "bg-[var(--color-primary)] text-black font-semibold"
                    : "bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <Link
            href="/admin/analytics"
            className="text-xs text-[var(--color-primary)] font-medium hover:underline"
          >
            Full Analytics →
          </Link>
        </div>
      </div>
      <SpendingChart data={chartData} />
    </div>
  );
}
