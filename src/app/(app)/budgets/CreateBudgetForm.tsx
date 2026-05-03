"use client";

import { useState, useRef } from "react";
import { createBudget } from "./actions";

type Dept = { id: string; name: string };

export function CreateBudgetForm({ departments }: { departments: Dept[] }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const currentYear = new Date().getFullYear();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await createBudget(new FormData(e.currentTarget));
      formRef.current?.reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create budget");
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";
  const labelClass =
    "block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5";

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
        style={{ background: "linear-gradient(135deg, #000000 0%, #111111 100%)" }}
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
        New Budget
      </button>

      {open && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
          <h3 className="font-display font-semibold text-[var(--color-on-surface)] mb-4">
            Create New Budget
          </h3>
          <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Department</label>
              <select name="departmentId" required className={inputClass}>
                <option value="">Select position…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Budget Name</label>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g. Social FA26"
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
                placeholder="0.00"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Semester</label>
              <select name="semester" required className={inputClass}>
                <option value="fall">Fall</option>
                <option value="spring">Spring</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Year</label>
              <input
                name="year"
                type="number"
                required
                defaultValue={currentYear}
                min={2020}
                max={2040}
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
                {pending ? "Creating…" : "Create Budget"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
