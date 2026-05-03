"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BudgetOption {
  id: string;
  name: string;
  department: { name: string; colorHex: string };
}

interface Props {
  budget?: BudgetOption;       // officer: single fixed budget
  budgets?: BudgetOption[];    // exec/admin: choosable list
}

export function TransactionForm({ budget, budgets }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBudgetId, setSelectedBudgetId] = useState(budgets?.[0]?.id ?? "");

  const selectedBudget = budget ?? budgets?.find((b) => b.id === selectedBudgetId) ?? budgets?.[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const getValue = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)?.value ?? "";

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        budgetId: budget?.id ?? selectedBudgetId,
        vendor: getValue("vendor"),
        category: getValue("category"),
        amount: getValue("amount"),
        date: getValue("date"),
        notes: getValue("notes"),
      }),
    });

    if (res.ok) {
      router.push("/transactions");
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Failed to save transaction.");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] text-sm px-4 py-3 rounded-xl outline-none border-b-2 border-transparent focus:border-[var(--color-primary)] transition-colors";
  const labelClass =
    "block text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Budget — read-only for officers, selector for execs/admins */}
      <div>
        <label className={labelClass}>Budget</label>
        {budget ? (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-surface-container-high)] border-l-4"
            style={{ borderLeftColor: budget.department.colorHex }}
          >
            <div>
              <p className="text-sm font-medium text-[var(--color-on-surface)]">{budget.name}</p>
              <p className="text-xs text-[var(--color-on-surface-variant)]">{budget.department.name}</p>
            </div>
          </div>
        ) : (
          <select
            value={selectedBudgetId}
            onChange={(e) => setSelectedBudgetId(e.target.value)}
            required
            className={inputClass + " cursor-pointer"}
          >
            <option value="">Select a budget…</option>
            {budgets?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.department.name} — {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Title */}
      <div>
        <label className={labelClass}>Title</label>
        <input
          type="text"
          name="vendor"
          placeholder="e.g. Office supplies from Staples"
          required
          className={inputClass}
        />
      </div>

      {/* Amount */}
      <div>
        <label className={labelClass}>Amount ($)</label>
        <input
          type="number"
          name="amount"
          placeholder="0.00"
          step="0.01"
          required
          className={inputClass}
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          name="notes"
          placeholder="What was purchased and why…"
          rows={3}
          className={inputClass + " resize-none"}
        />
      </div>

      {/* Date */}
      <div>
        <label className={labelClass}>Date</label>
        <input type="date" name="date" required className={inputClass} />
      </div>

      {/* Category */}
      <div>
        <label className={labelClass}>Category</label>
        <input
          type="text"
          name="category"
          placeholder="e.g. Supplies, Travel, Events"
          required
          className={inputClass}
        />
      </div>

      {error && (
        <p className="text-[var(--color-error)] text-sm bg-[var(--color-error-container)] px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 rounded-xl text-[var(--color-on-surface)] text-sm font-semibold bg-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-highest)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #000000 0%, #111111 100%)" }}
        >
          {loading ? "Saving…" : "Save Transaction"}
        </button>
      </div>
    </form>
  );
}
