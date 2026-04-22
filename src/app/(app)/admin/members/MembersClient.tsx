"use client";

import { useState, useRef } from "react";
import { createMember, updateDuesStatus } from "./actions";

type MemberRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tier: string;
  duesStatus: string;
  lastPayment: Date | null;
};

const DUES_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  exempt: "bg-gray-100 text-gray-600",
};

export function MembersClient({ members }: { members: MemberRow[] }) {
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterDues, setFilterDues] = useState<string>("all");
  const formRef = useRef<HTMLFormElement>(null);

  const filtered = filterDues === "all"
    ? members
    : members.filter((m) => m.duesStatus === filterDues);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      await createMember(fd);
      formRef.current?.reset();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setPending(false);
    }
  }

  async function handleDuesToggle(id: string, current: string) {
    const next = current === "paid" ? "overdue" : "paid";
    await updateDuesStatus(id, next as "paid" | "overdue" | "exempt");
  }

  const paidCount = members.filter((m) => m.duesStatus === "paid").length;
  const overdueCount = members.filter((m) => m.duesStatus === "overdue").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Member Roster
          </h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
            {members.length} brothers · {paidCount} paid · {overdueCount} overdue
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #002046 0%, #1b365d 100%)" }}
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          Add Brother
        </button>
      </div>

      {/* Add member form */}
      {showForm && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
          <h3 className="font-display font-semibold text-[var(--color-on-surface)] mb-4">
            Add New Brother
          </h3>
          <form ref={formRef} onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="John Smith"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="john@berkeley.edu"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                Phone (optional)
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="415-555-0100"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                Pledge Class
              </label>
              <input
                name="tier"
                type="text"
                placeholder="FA26, SP26, FA25…"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                Dues Status
              </label>
              <select
                name="duesStatus"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="overdue">Overdue</option>
                <option value="paid">Paid</option>
                <option value="exempt">Exempt</option>
              </select>
            </div>

            {error && (
              <p className="col-span-2 text-sm text-[var(--color-error)]">{error}</p>
            )}

            <div className="col-span-2 flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(null); }}
                className="px-4 py-2 rounded-xl text-sm text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #002046 0%, #1b365d 100%)" }}
              >
                {pending ? "Adding…" : "Add Brother"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-on-surface-variant)] font-medium">Filter:</span>
        {["all", "paid", "overdue", "exempt"].map((f) => (
          <button
            key={f}
            onClick={() => setFilterDues(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
              filterDues === f
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* Roster table */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-[var(--color-on-surface-variant)] text-sm">
            No brothers match this filter.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Brother", "Contact", "Dues Status", "Pledge Class", "Last Payment", "Actions"].map((h) => (
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
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-[var(--color-surface-container-low)] transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <p className="font-medium text-[var(--color-on-surface)]">{m.name}</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-xs text-[var(--color-on-surface-variant)]">
                    <p>{m.email}</p>
                    {m.phone && <p>{m.phone}</p>}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${DUES_COLORS[m.duesStatus] ?? ""}`}>
                      {m.duesStatus}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[var(--color-on-surface-variant)] font-mono text-xs uppercase">
                    {m.tier || "—"}
                  </td>
                  <td className="py-3 pr-4 text-xs text-[var(--color-on-surface-variant)]">
                    {m.lastPayment ? new Date(m.lastPayment).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td className="py-3">
                    {m.duesStatus !== "exempt" && (
                      <button
                        onClick={() => handleDuesToggle(m.id, m.duesStatus)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                          m.duesStatus === "paid"
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        Mark {m.duesStatus === "paid" ? "Overdue" : "Paid"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
