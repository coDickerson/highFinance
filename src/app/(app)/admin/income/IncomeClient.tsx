"use client";

import { useState, useRef } from "react";
import { createIncome, updateIncome, deleteIncome } from "./actions";

const TYPE_LABELS: Record<string, string> = {
  dues: "Dues Collection",
  rental: "House Rental",
  other: "Other",
};

const TYPE_ICONS: Record<string, string> = {
  dues: "group",
  rental: "home",
  other: "attach_money",
};

type IncomeRow = {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  semester: string;
  year: number;
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function semesterLabel(s: string, y: number) {
  return `${s === "fall" ? "FA" : "SP"}${String(y).slice(2)}`;
}

export function IncomeClient({
  rows,
  currentSemester,
  currentYear,
  paidMembers,
  totalMembers,
  rosterDuesPaid,
}: {
  rows: IncomeRow[];
  currentSemester: string;
  currentYear: number;
  paidMembers: number;
  totalMembers: number;
  rosterDuesPaid: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const [filterSem, setFilterSem] = useState<string>("all");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Collect unique semester options from data + current
  const semesterOptions = Array.from(
    new Set([
      semesterLabel(currentSemester, currentYear),
      ...rows.map((r) => semesterLabel(r.semester, r.year)),
    ])
  );

  const filtered = filterSem === "all" ? rows : rows.filter(
    (r) => semesterLabel(r.semester, r.year) === filterSem
  );

  const total = filtered.reduce((s, r) => s + r.amount, 0);
  const currentSemRows = rows.filter(
    (r) => r.semester === currentSemester && r.year === currentYear
  );
  const currentSemTotal = currentSemRows.reduce((s, r) => s + r.amount, 0);
  const yearlyRows = rows.filter((r) => r.year === currentYear);
  const yearlyTotal = yearlyRows.reduce((s, r) => s + r.amount, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      await createIncome(fd);
      formRef.current?.reset();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId) return;
    setEditPending(true);
    setEditError(null);
    try {
      await updateIncome(editingId, new FormData(e.currentTarget));
      setEditingId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setEditPending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this income entry?")) return;
    await deleteIncome(id);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Income Tracking
          </h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
            Dues collections, house rentals, and other revenue
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #000000 0%, #111111 100%)" }}
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Income
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5">
          <p className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1">
            {semesterLabel(currentSemester, currentYear)} Total
          </p>
          <p className="font-display text-2xl font-extrabold text-[var(--color-on-surface)]">
            {fmt(currentSemTotal)}
          </p>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
            {currentSemRows.length} entr{currentSemRows.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5">
          <p className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1">
            {currentYear} Yearly Total
          </p>
          <p className="font-display text-2xl font-extrabold text-[var(--color-on-surface)]">
            {fmt(yearlyTotal)}
          </p>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
            {yearlyRows.length} entr{yearlyRows.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5">
          <p className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1">
            Dues Roster
          </p>
          <p className="font-display text-2xl font-extrabold text-[var(--color-on-surface)]">
            {paidMembers} <span className="text-base font-normal text-[var(--color-on-surface-variant)]">/ {totalMembers}</span>
          </p>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
            brothers paid · {totalMembers - paidMembers} outstanding
          </p>
          <p className="text-xs text-[var(--color-secondary)] font-semibold mt-1">
            {fmt(rosterDuesPaid)} collected from roster
          </p>
        </div>
      </div>

      {/* Add Income form */}
      {showForm && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
          <h3 className="font-display font-semibold text-[var(--color-on-surface)] mb-4">
            New Income Entry
          </h3>
          <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                Type
              </label>
              <select
                name="type"
                required
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="dues">Dues Collection</option>
                <option value="rental">House Rental</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                Amount ($)
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                Description
              </label>
              <input
                name="description"
                type="text"
                required
                placeholder="e.g. Fall 2026 dues collection, SBC rental income..."
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                name="date"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                  Semester
                </label>
                <select
                  name="semester"
                  required
                  defaultValue={currentSemester}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="fall">Fall</option>
                  <option value="spring">Spring</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                  Year
                </label>
                <input
                  name="year"
                  type="number"
                  required
                  defaultValue={currentYear}
                  min="2020"
                  max="2040"
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>

            {error && (
              <p className="col-span-2 text-sm text-[var(--color-error)]">{error}</p>
            )}

            <div className="col-span-2 flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
                {pending ? "Saving…" : "Save Entry"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[var(--color-on-surface-variant)] font-medium">Filter:</span>
        <button
          onClick={() => setFilterSem("all")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            filterSem === "all"
              ? "bg-[var(--color-primary)] text-black"
              : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
          }`}
        >
          All
        </button>
        {semesterOptions.map((s) => (
          <button
            key={s}
            onClick={() => setFilterSem(s)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              filterSem === s
                ? "bg-[var(--color-primary)] text-black"
                : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Income table */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-[var(--color-on-surface-variant)] text-sm">
            No income entries yet. Click &ldquo;Add Income&rdquo; to record revenue.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Date", "Type", "Description", "Semester", "Amount", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] pb-4 pr-4"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isEditing = editingId === row.id;
                return isEditing ? (
                  <tr key={row.id}>
                    <td colSpan={6} className="py-3">
                      <form onSubmit={handleEdit} className="grid grid-cols-6 gap-2 bg-[var(--color-surface-container-low)] rounded-xl p-3">
                        <input name="date" type="date" required defaultValue={row.date.split("T")[0]} className="col-span-1 px-2 py-1.5 rounded-lg bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none" />
                        <select name="type" required defaultValue={row.type} className="col-span-1 px-2 py-1.5 rounded-lg bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none">
                          <option value="dues">Dues</option>
                          <option value="rental">Rental</option>
                          <option value="other">Other</option>
                        </select>
                        <input name="description" type="text" required defaultValue={row.description} className="col-span-2 px-2 py-1.5 rounded-lg bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none" />
                        <input name="amount" type="number" step="0.01" required defaultValue={row.amount} className="px-2 py-1.5 rounded-lg bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-xs text-[var(--color-on-surface)] focus:outline-none" />
                        <div className="flex gap-1">
                          <input name="semester" type="hidden" value={row.semester} />
                          <input name="year" type="hidden" value={row.year} />
                          <button type="submit" disabled={editPending} className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-green-900 text-green-200 disabled:opacity-50">{editPending ? "…" : "Save"}</button>
                          <button type="button" onClick={() => setEditingId(null)} className="px-2 py-1.5 rounded-lg text-xs text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]">Cancel</button>
                        </div>
                        {editError && <p className="col-span-6 text-xs text-[var(--color-error)]">{editError}</p>}
                      </form>
                    </td>
                  </tr>
                ) : (
                <tr key={row.id} className="hover:bg-[var(--color-surface-container-low)] transition-colors">
                  <td className="py-3 pr-4 text-xs text-[var(--color-on-surface-variant)] whitespace-nowrap">
                    {new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[var(--color-surface-container)] flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-[14px]">
                          {TYPE_ICONS[row.type] ?? "attach_money"}
                        </span>
                      </div>
                      <span className="text-[var(--color-on-surface)] font-medium">
                        {TYPE_LABELS[row.type] ?? row.type}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-[var(--color-on-surface-variant)] max-w-xs truncate">
                    {row.description}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]">
                      {semesterLabel(row.semester, row.year)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-semibold tabular-nums text-[var(--color-secondary)]">
                    {fmt(row.amount)}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingId(row.id)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => handleDelete(row.id)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
