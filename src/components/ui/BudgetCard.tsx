import { ProgressBar } from "./ProgressBar";

interface BudgetCardProps {
  name: string;
  description?: string;
  colorHex: string;
  totalAmount: number;
  spent: number;
  transactionCount?: number;
  semester?: string;
}

export function BudgetCard({
  name,
  description,
  colorHex,
  totalAmount,
  spent,
  transactionCount,
  semester,
}: BudgetCardProps) {
  const available = totalAmount - spent;
  const pct = totalAmount > 0 ? Math.round((spent / totalAmount) * 100) : 0;
  const isOverageRisk = pct >= 95;

  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl overflow-hidden flex">
      {/* Accent stripe */}
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: colorHex }} />

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-display font-semibold text-[var(--color-on-surface)] text-sm">
              {name}
            </p>
            {description && (
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5 line-clamp-1">
                {description}
              </p>
            )}
          </div>
          {semester && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] ml-auto">
              {semester}
            </span>
          )}
          {isOverageRisk && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-error-container)] text-[var(--color-on-error-container)]">
              Overage Risk
            </span>
          )}
        </div>

        <div className="mb-2">
          <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Available</p>
          <p className="font-display text-xl font-bold text-[var(--color-on-surface)]">
            {available.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </p>
        </div>

        <ProgressBar value={spent} max={totalAmount} />

        <div className="flex justify-between mt-1.5 text-xs text-[var(--color-on-surface-variant)]">
          <span>{pct}% used</span>
          <span>
            {totalAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })} total
          </span>
        </div>

        {transactionCount !== undefined && (
          <p className="mt-2 text-xs text-[var(--color-on-surface-variant)]">
            {transactionCount} transaction{transactionCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
