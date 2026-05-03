"use client";

import { useState } from "react";
import { updateBudget } from "./actions";

type Props = {
  id: string;
  currentName: string;
  currentTotal: number;
};

export function EditBudgetForm({ id, currentName, currentTotal }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await updateBudget(id, new FormData(e.currentTarget));
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update budget");
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";
  const labelClass =
    "block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-[14px]">edit</span>
        Edit
      </button>
    );
  }

  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
      <h3 className="font-display font-semibold text-[var(--color-on-surface)] mb-4">Edit Budget</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Budget Name</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={currentName}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Total Amount ($)</label>
          <input
            name="totalAmount"
            type="number"
            required
            min="0"
            step="0.01"
            defaultValue={currentTotal}
            className={inputClass}
          />
        </div>
        {error && (
          <p className="col-span-2 text-sm text-[var(--color-error)]">{error}</p>
        )}
        <div className="col-span-2 flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={() => { setOpen(false); setError(null); }}
            className="px-4 py-2 rounded-xl text-sm text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #000000 0%, #111111 100%)" }}
          >
            {pending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
