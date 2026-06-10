"use client";

import { useState, useEffect } from "react";
import { BudgetCard } from "@/components/ui/BudgetCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EditBudgetForm } from "./EditBudgetForm";
import { CreateBudgetForm } from "./CreateBudgetForm";
import { deleteBudget } from "./actions";

interface Transaction {
  id: string;
  vendor: string;
  category: string;
  amount: number;
  date: string;
  status: string;
}

interface BudgetItem {
  id: string;
  name: string;
  description?: string;
  colorHex: string;
  totalAmount: number;
  spent: number;
  transactionCount: number;
  semester: string;
  transactions: Transaction[];
}

interface Props {
  budgets: BudgetItem[];
  departments: { id: string; name: string }[];
  isAdmin: boolean;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function BudgetsAdminClient({ budgets, departments, isAdmin }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selected = budgets.find((b) => b.id === selectedId) ?? null;

  // Trigger enter animation after mount
  useEffect(() => {
    if (selectedId) {
      const t = setTimeout(() => setMounted(true), 10);
      return () => clearTimeout(t);
    } else {
      setMounted(false);
    }
  }, [selectedId]);

  function open(id: string) {
    setSelectedId(id);
  }

  function close() {
    setMounted(false);
    setTimeout(() => setSelectedId(null), 300);
  }

  async function handleDelete() {
    if (!selectedId) return;
    setDeleting(true);
    try {
      await deleteBudget(selectedId);
      close();
    } finally {
      setDeleting(false);
    }
  }

  const available = selected ? selected.totalAmount - selected.spent : 0;
  const utilPct = selected && selected.totalAmount > 0
    ? Math.round((selected.spent / selected.totalAmount) * 100)
    : 0;

  return (
    <>
      {/* Drawer backdrop + panel */}
      {selectedId && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
            style={{ opacity: mounted ? 1 : 0 }}
            onClick={close}
          />

          {/* Drawer */}
          <div
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-[var(--color-surface-container-lowest)] z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out overflow-hidden"
            style={{ transform: mounted ? "translateX(0)" : "translateX(100%)" }}
          >
            {/* Drawer header */}
            <div className="flex items-start justify-between p-6 border-b border-[var(--color-outline-variant)] flex-shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  {selected && (
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: selected.colorHex }} />
                  )}
                  <h2 className="font-display text-lg font-extrabold text-[var(--color-on-surface)] truncate">
                    {selected?.name}
                  </h2>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]">
                  {selected?.semester}
                </span>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Balance summary */}
              {selected && (
                <div className="bg-[var(--color-surface-container-low)] rounded-2xl p-5">
                  <div className="flex items-end gap-6 mb-4">
                    <div>
                      <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Available</p>
                      <p className="font-display text-3xl font-extrabold text-[var(--color-on-surface)]">
                        {fmt(available)}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Total Budget</p>
                      <p className="font-display text-lg font-semibold text-[var(--color-on-surface-variant)]">
                        {fmt(selected.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <ProgressBar value={selected.spent} max={selected.totalAmount} />
                  <div className="flex justify-between mt-1.5 text-xs text-[var(--color-on-surface-variant)]">
                    <span>{utilPct}% utilized</span>
                    <span>{fmt(selected.spent)} spent</span>
                  </div>
                </div>
              )}

              {/* Transactions */}
              <div>
                <h3 className="font-display font-semibold text-[var(--color-on-surface)] mb-3">
                  Transactions
                </h3>
                {selected?.transactions.length === 0 ? (
                  <p className="text-[var(--color-on-surface-variant)] text-sm">No transactions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selected?.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">
                            {tx.vendor}
                          </p>
                          <p className="text-xs text-[var(--color-on-surface-variant)]">
                            {tx.category} · {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <StatusBadge status={tx.status} />
                        <p className={`font-semibold text-sm tabular-nums w-20 text-right ${tx.amount < 0 ? "text-[var(--color-error)]" : "text-[var(--color-secondary)]"}`}>
                          {fmt(Math.abs(tx.amount))}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer footer — admin actions */}
            {isAdmin && selected && (
              <div className="flex-shrink-0 border-t border-[var(--color-outline-variant)] p-6 flex items-center gap-3">
                <EditBudgetForm
                  id={selected.id}
                  currentName={selected.name}
                  currentTotal={selected.totalAmount}
                />
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium text-[var(--color-error)] bg-[var(--color-error-container)] hover:opacity-80 transition-opacity disabled:opacity-40 ml-auto"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  {deleting ? "Deleting…" : "Delete Budget"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Budget grid */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
              All Officer Budgets
            </h2>
            <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
              Active budgets across all positions
            </p>
          </div>
          {isAdmin && (
            <CreateBudgetForm departments={departments} />
          )}
        </div>

        {budgets.length === 0 ? (
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-8 text-center">
            <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-4xl mb-3 block">
              account_balance_wallet
            </span>
            <p className="text-[var(--color-on-surface)] font-medium mb-1">No active budgets yet</p>
            <p className="text-[var(--color-on-surface-variant)] text-sm">
              Create budgets for each officer position to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {budgets.map((b) => (
              <button
                key={b.id}
                onClick={() => open(b.id)}
                className="text-left w-full hover:scale-[1.01] transition-transform duration-150"
              >
                <BudgetCard
                  name={b.name}
                  description={b.description}
                  colorHex={b.colorHex}
                  totalAmount={b.totalAmount}
                  spent={b.spent}
                  transactionCount={b.transactionCount}
                  semester={b.semester}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
