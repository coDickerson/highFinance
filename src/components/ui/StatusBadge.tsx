type Status = "approved" | "pending" | "denied" | "paid" | "overdue" | "exempt" | string;

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]",
  paid:     "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]",
  pending:  "bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]",
  denied:   "bg-[var(--color-error-container)] text-[var(--color-on-error-container)]",
  overdue:  "bg-[var(--color-error-container)] text-[var(--color-on-error-container)]",
  exempt:   "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]",
};

export function StatusBadge({ status }: { status: Status }) {
  const key = status.toLowerCase();
  const cls = STATUS_STYLES[key] ?? STATUS_STYLES.pending;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${cls}`}
    >
      {status}
    </span>
  );
}
