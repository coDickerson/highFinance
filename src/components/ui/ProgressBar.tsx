"use client";

function utilizationColor(pct: number) {
  if (pct >= 95) return "bg-[var(--color-error)]";
  if (pct >= 75) return "bg-[var(--color-on-tertiary-container)]";
  return "bg-[var(--color-secondary)]";
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${utilizationColor(pct)}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
