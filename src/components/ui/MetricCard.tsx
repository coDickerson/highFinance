export function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4">
      <p className="text-[var(--color-on-surface-variant)] text-xs font-medium uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="font-display text-2xl font-bold text-[var(--color-on-surface)]">
        {value}
      </p>
      {sub && (
        <p className="text-[var(--color-on-surface-variant)] text-xs mt-1">{sub}</p>
      )}
    </div>
  );
}
