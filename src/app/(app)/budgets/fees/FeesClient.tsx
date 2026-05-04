"use client";

import { useState } from "react";
import { createFeeItem, updateFeeItem, deleteFeeItem } from "./actions";

type FeeItemRow = {
  id: string;
  description: string;
  perMember: number | null;
  estimatedTotal: number;
  actualTotal: number | null;
  dueDate: string | null;
  paidDate: string | null;
  notes: string | null;
};

type FeeCategoryRow = {
  id: string;
  name: string;
  items: FeeItemRow[];
};

type FeeBudgetRow = {
  id: string;
  semester: string;
  year: number;
  categories: FeeCategoryRow[];
};

interface Props {
  feeBudget: FeeBudgetRow;
  feeBudgetId: string;
  memberCount: number;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtDate(s: string | null) {
  if (!s) return "—";
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function semLabel(s: string, y: number) {
  return `${s === "fall" ? "FA" : "SP"}${String(y).slice(2)}`;
}

const COLS = ["Category", "Budget Item", "Per Member", "Est. Total", "Actual Paid", "Paid Date", "Due Date / Notes", ""];

export function FeesClient({ feeBudget, feeBudgetId, memberCount }: Props) {
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const categories = feeBudget.categories;
  const allItems = categories.flatMap((c) => c.items);
  const feeEstTotal = allItems.reduce((s, i) => s + i.estimatedTotal, 0);
  const feeActTotal = allItems.reduce((s, i) => s + (i.actualTotal ?? 0), 0);

  const inputClass =
    "px-3 py-2 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";

  async function handleAddItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const fd = new FormData(e.currentTarget);
      const perMember = parseFloat(fd.get("perMember") as string);
      if (!isNaN(perMember) && perMember > 0) {
        const est = parseFloat(fd.get("estimatedTotal") as string);
        if (!est) fd.set("estimatedTotal", String(perMember * memberCount));
      }
      await createFeeItem(fd);
      setAddingItem(false);
      (e.target as HTMLFormElement).reset();
    } finally {
      setPending(false);
    }
  }

  async function handleUpdateItem(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setPending(true);
    try {
      await updateFeeItem(id, new FormData(e.currentTarget));
      setEditingItemId(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            {semLabel(feeBudget.semester, feeBudget.year)} Fee Tracker
          </h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
            National, IFC, and chapter fee tracking · {memberCount} members
          </p>
        </div>
        <button
          onClick={() => setAddingItem(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #000000 0%, #111111 100%)" }}
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Item
        </button>
      </div>

      {/* Add item form */}
      {addingItem && (
        <form
          onSubmit={handleAddItem}
          className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 space-y-4"
        >
          <p className="text-sm font-semibold text-[var(--color-on-surface)]">New Fee Item</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Category</label>
              <select name="feeCategoryId" required className={inputClass + " w-full"}>
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Description</label>
              <input name="description" type="text" required placeholder="e.g. IFC Dues" className={inputClass + " w-full"} />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Per Member ($)</label>
              <input name="perMember" type="number" step="0.01" min="0" placeholder="optional" className={inputClass + " w-full"} />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Est. Total ($)</label>
              <input name="estimatedTotal" type="number" step="0.01" min="0" placeholder="auto from per-member" className={inputClass + " w-full"} />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Actual Paid ($)</label>
              <input name="actualTotal" type="number" step="0.01" min="0" placeholder="optional" className={inputClass + " w-full"} />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Paid Date</label>
              <input name="paidDate" type="date" className={inputClass + " w-full"} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-[var(--color-on-surface-variant)] mb-1">Due Date / Notes</label>
              <input name="dueDate" type="text" placeholder="e.g. March 1 or TBD" className={inputClass + " w-full"} />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #000000 0%, #111111 100%)" }}
            >
              {pending ? "Adding…" : "Add Item"}
            </button>
            <button
              type="button"
              onClick={() => setAddingItem(false)}
              className="px-3 py-2 rounded-xl text-sm text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Fee table */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-[var(--color-outline-variant)]">
              {COLS.map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] px-4 py-3 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.every((c) => c.items.length === 0) ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--color-on-surface-variant)] text-sm">
                  No items yet. Click &ldquo;Add Item&rdquo; to start tracking fees.
                </td>
              </tr>
            ) : (
              categories.map((cat) =>
                cat.items.length === 0 ? null : (
                  <>
                    {/* Category header row */}
                    <tr key={`cat-${cat.id}`} className="bg-[var(--color-surface-container-low)]">
                      <td colSpan={8} className="px-4 py-2">
                        <span className="font-semibold text-[var(--color-on-surface)] text-sm">{cat.name}</span>
                      </td>
                    </tr>

                    {/* Fee items */}
                    {cat.items.map((item) =>
                      editingItemId === item.id ? (
                        <tr key={`edit-${item.id}`}>
                          <td colSpan={8} className="px-4 py-3">
                            <form
                              onSubmit={(e) => handleUpdateItem(e, item.id)}
                              className="grid grid-cols-9 gap-2"
                            >
                              <div className="col-span-1" />
                              <input
                                name="description"
                                type="text"
                                required
                                defaultValue={item.description}
                                className={inputClass + " col-span-2"}
                              />
                              <input
                                name="perMember"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={item.perMember ?? ""}
                                placeholder="n/a"
                                className={inputClass}
                              />
                              <input
                                name="estimatedTotal"
                                type="number"
                                step="0.01"
                                required
                                defaultValue={item.estimatedTotal}
                                className={inputClass}
                              />
                              <input
                                name="actualTotal"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={item.actualTotal ?? ""}
                                placeholder="Actual paid"
                                className={inputClass}
                              />
                              <input
                                name="paidDate"
                                type="date"
                                defaultValue={item.paidDate ?? ""}
                                className={inputClass}
                              />
                              <input
                                name="dueDate"
                                type="text"
                                defaultValue={item.dueDate ?? ""}
                                placeholder="Due date / notes"
                                className={inputClass}
                              />
                              <div className="flex gap-1">
                                <button
                                  type="submit"
                                  disabled={pending}
                                  className="px-3 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50"
                                  style={{ background: "linear-gradient(135deg, #000000 0%, #111111 100%)" }}
                                >
                                  {pending ? "…" : "Save"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingItemId(null)}
                                  className="px-2 py-2 rounded-xl text-xs text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]"
                                >
                                  ✕
                                </button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      ) : (
                        <tr
                          key={item.id}
                          className="border-t border-[var(--color-outline-variant)]/20 hover:bg-[var(--color-surface-container-low)] transition-colors"
                        >
                          <td className="px-4 py-2.5" />
                          <td className="px-4 py-2.5 text-[var(--color-on-surface)]">{item.description}</td>
                          <td className="px-4 py-2.5 text-[var(--color-on-surface-variant)] tabular-nums">
                            {item.perMember != null ? (
                              fmt(item.perMember)
                            ) : (
                              <span className="text-[var(--color-on-surface-variant)]/40">n/a</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-semibold tabular-nums text-[var(--color-on-surface)]">
                            {fmt(item.estimatedTotal)}
                            {item.perMember != null && (
                              <span className="ml-1 text-xs text-[var(--color-on-surface-variant)]/50">
                                (×{memberCount})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 tabular-nums">
                            {item.actualTotal != null ? (
                              <span className="font-semibold text-[var(--color-secondary)]">
                                {fmt(item.actualTotal)}
                              </span>
                            ) : (
                              <span className="text-[var(--color-on-surface-variant)]/40">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-[var(--color-on-surface-variant)] whitespace-nowrap">
                            {fmtDate(item.paidDate)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-[var(--color-on-surface-variant)]">
                            {item.dueDate ?? "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingItemId(item.id)}
                                className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm("Delete this fee item?")) await deleteFeeItem(item.id);
                                }}
                                className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </>
                )
              )
            )}

            {/* Totals row */}
            {allItems.length > 0 && (
              <tr className="border-t-2 border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
                <td
                  colSpan={3}
                  className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)]"
                >
                  Totals:
                </td>
                <td className="px-4 py-3 font-display font-extrabold text-[var(--color-on-surface)] tabular-nums">
                  {fmt(feeEstTotal)}
                </td>
                <td className="px-4 py-3 font-display font-extrabold text-[var(--color-secondary)] tabular-nums">
                  {feeActTotal > 0 ? (
                    fmt(feeActTotal)
                  ) : (
                    <span className="text-[var(--color-on-surface-variant)]/40">—</span>
                  )}
                </td>
                <td colSpan={3} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
