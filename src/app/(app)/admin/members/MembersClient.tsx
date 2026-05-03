"use client";

import { useState, useRef } from "react";
import { createMember, updateDuesAmounts } from "./actions";
import { SignupManager } from "@/components/ui/SignupManager";

type MemberRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tier: string;
  duesStatus: string;
  lastPayment: string | null;
  duesOwed: number;
  duesPaid: number;
  dueDate: string | null;
};

type SignupRow = {
  id: string;
  name: string;
  email: string;
  departmentId: string | null;
  role: string;
  status: string;
  createdAt: string;
  department: { name: string } | null;
};

type Department = { id: string; name: string };

const DUES_COLORS: Record<string, string> = {
  paid:        "bg-green-100 text-green-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  overdue:     "bg-red-100 text-red-800",
  exempt:      "bg-gray-100 text-gray-600",
};

const DUES_LABELS: Record<string, string> = {
  paid:        "Paid",
  in_progress: "In Progress",
  overdue:     "Overdue",
  exempt:      "Exempt",
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

type EditState = { owed: string; paid: string; dueDate: string; exempt: boolean };

export function MembersClient({
  members,
  isAdmin,
  signupRequests,
  departments,
}: {
  members: MemberRow[];
  isAdmin: boolean;
  signupRequests: SignupRow[];
  departments: Department[];
}) {
  const [showForm, setShowForm]       = useState(false);
  const [showSignups, setShowSignups] = useState(false);
  const [pending, setPending]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [filterDues, setFilterDues]   = useState<string>("all");
  const formRef = useRef<HTMLFormElement>(null);

  const [editing, setEditing] = useState<Record<string, EditState>>({});

  const filtered = filterDues === "all"
    ? members
    : members.filter((m) => m.duesStatus === filterDues);

  const paidCount    = members.filter((m) => m.duesStatus === "paid").length;
  const overdueCount = members.filter((m) => m.duesStatus === "overdue").length;
  const pendingSignupCount = signupRequests.filter((r) => r.status === "pending").length;

  const totalOwed        = members.reduce((s, m) => s + m.duesOwed, 0);
  const totalPaid        = members.reduce((s, m) => s + m.duesPaid, 0);
  const totalOutstanding = totalOwed - totalPaid;

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await createMember(new FormData(e.currentTarget));
      formRef.current?.reset();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setPending(false);
    }
  }

  function startEdit(m: MemberRow) {
    setEditing((prev) => ({
      ...prev,
      [m.id]: {
        owed:    String(m.duesOwed),
        paid:    String(m.duesPaid),
        dueDate: m.dueDate ?? "",
        exempt:  m.duesStatus === "exempt",
      },
    }));
  }

  function cancelEdit(id: string) {
    setEditing((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  async function saveEdit(id: string) {
    const vals = editing[id];
    if (!vals) return;
    await updateDuesAmounts(
      id,
      parseFloat(vals.owed) || 0,
      parseFloat(vals.paid) || 0,
      vals.dueDate || null,
      vals.exempt
    );
    cancelEdit(id);
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

  const miniInput =
    "px-2 py-1 rounded-lg bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";

  return (
    <div className="space-y-5">
      {/* Signup Manager Modal */}
      {showSignups && (
        <div className="fixed inset-0 z-50 flex items-stretch">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSignups(false)} />
          <div className="relative ml-auto w-full max-w-4xl bg-[var(--color-surface-container-lowest)] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-outline-variant)]">
              <h2 className="font-display text-lg font-bold text-[var(--color-on-surface)]">
                Signup Approval Manager
              </h2>
              <button
                onClick={() => setShowSignups(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SignupManager requests={signupRequests} departments={departments} />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Member Roster
          </h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
            {members.length} brothers · {paidCount} paid · {overdueCount} overdue
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowSignups(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-surface-container)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
              Review Signups
              {pendingSignupCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-error)] text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingSignupCount}
                </span>
              )}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #000000 0%, #111111 100%)" }}
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              Add Brother
            </button>
          )}
        </div>
      </div>

      {/* Add member form */}
      {isAdmin && showForm && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
          <h3 className="font-display font-semibold text-[var(--color-on-surface)] mb-4">Add New Brother</h3>
          <form ref={formRef} onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">Full Name</label>
              <input name="name" type="text" required placeholder="John Smith" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">Email</label>
              <input name="email" type="email" required placeholder="john@berkeley.edu" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">Phone (optional)</label>
              <input name="phone" type="tel" placeholder="415-555-0100" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">Pledge Class</label>
              <input name="tier" type="text" placeholder="FA26, SP26…" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">Initial Status</label>
              <select name="duesStatus" className={inputClass}>
                <option value="overdue">Overdue</option>
                <option value="in_progress">In Progress</option>
                <option value="paid">Paid</option>
                <option value="exempt">Exempt</option>
              </select>
            </div>
            {error && <p className="col-span-2 text-sm text-[var(--color-error)]">{error}</p>}
            <div className="col-span-2 flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => { setShowForm(false); setError(null); }} className="px-4 py-2 rounded-xl text-sm text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={pending} className="px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50" style={{ background: "linear-gradient(135deg, #000000 0%, #111111 100%)" }}>
                {pending ? "Adding…" : "Add Brother"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dues summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4">
          <p className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1">Total Owed</p>
          <p className="font-display text-xl font-extrabold text-[var(--color-on-surface)]">{fmt(totalOwed)}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4">
          <p className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1">Total Collected</p>
          <p className="font-display text-xl font-extrabold text-[var(--color-secondary)]">{fmt(totalPaid)}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4">
          <p className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1">Outstanding</p>
          <p className={`font-display text-xl font-extrabold ${totalOutstanding > 0 ? "text-[var(--color-error)]" : "text-[var(--color-secondary)]"}`}>
            {fmt(totalOutstanding)}
          </p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[var(--color-on-surface-variant)] font-medium">Filter:</span>
        {["all", "paid", "in_progress", "overdue", "exempt"].map((f) => (
          <button
            key={f}
            onClick={() => setFilterDues(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
              filterDues === f
                ? "bg-[var(--color-primary)] text-black"
                : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
            }`}
          >
            {f === "all" ? "All" : DUES_LABELS[f] ?? f}
          </button>
        ))}
      </div>

      {/* Roster table */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-[var(--color-on-surface-variant)] text-sm">No brothers match this filter.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Brother", "Contact", "Status", "Class", "Due Date", "Owed", "Paid", "Balance", ""].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] pb-4 pr-4 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const isEditing = !!editing[m.id];
                const ed        = editing[m.id];
                const balance   = m.duesOwed - m.duesPaid;

                return (
                  <tr key={m.id} className="border-t border-[var(--color-outline-variant)]/30 hover:bg-[var(--color-surface-container-low)] transition-colors">
                    {/* Name */}
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <p className="font-medium text-[var(--color-on-surface)] whitespace-nowrap">{m.name}</p>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 pr-4 text-xs text-[var(--color-on-surface-variant)]">
                      <p>{m.email}</p>
                      {m.phone && <p>{m.phone}</p>}
                    </td>

                    {/* Status badge */}
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${DUES_COLORS[m.duesStatus] ?? ""}`}>
                        {DUES_LABELS[m.duesStatus] ?? m.duesStatus}
                      </span>
                    </td>

                    {/* Pledge class */}
                    <td className="py-3 pr-4 text-[var(--color-on-surface-variant)] font-mono text-xs uppercase">
                      {m.tier || "—"}
                    </td>

                    {/* Due Date */}
                    <td className="py-3 pr-4 text-xs text-[var(--color-on-surface-variant)] whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="date"
                          value={ed.dueDate}
                          onChange={(e) => setEditing((prev) => ({ ...prev, [m.id]: { ...prev[m.id], dueDate: e.target.value } }))}
                          className={miniInput + " w-32"}
                        />
                      ) : (
                        m.dueDate
                          ? new Date(m.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : <span className="text-[var(--color-on-surface-variant)]/40">—</span>
                      )}
                    </td>

                    {/* Owed */}
                    <td className="py-3 pr-4 tabular-nums text-xs">
                      {isEditing ? (
                        <input
                          type="number" step="0.01" min="0"
                          value={ed.owed}
                          onChange={(e) => setEditing((prev) => ({ ...prev, [m.id]: { ...prev[m.id], owed: e.target.value } }))}
                          className={miniInput + " w-20"}
                        />
                      ) : fmt(m.duesOwed)}
                    </td>

                    {/* Paid */}
                    <td className="py-3 pr-4 tabular-nums text-xs text-[var(--color-secondary)]">
                      {isEditing ? (
                        <input
                          type="number" step="0.01" min="0"
                          value={ed.paid}
                          onChange={(e) => setEditing((prev) => ({ ...prev, [m.id]: { ...prev[m.id], paid: e.target.value } }))}
                          className={miniInput + " w-20"}
                        />
                      ) : fmt(m.duesPaid)}
                    </td>

                    {/* Balance */}
                    <td className="py-3 pr-4 tabular-nums text-xs font-semibold">
                      <span className={balance > 0 ? "text-[var(--color-error)]" : "text-[var(--color-secondary)]"}>
                        {fmt(balance)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3">
                      {isAdmin && (
                        isEditing ? (
                          <div className="flex flex-col gap-1.5 min-w-[120px]">
                            {/* Exempt toggle */}
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={ed.exempt}
                                onChange={(e) => setEditing((prev) => ({ ...prev, [m.id]: { ...prev[m.id], exempt: e.target.checked } }))}
                                className="rounded"
                              />
                              <span className="text-xs text-[var(--color-on-surface-variant)]">Exempt</span>
                            </label>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => saveEdit(m.id)}
                                className="text-xs px-2.5 py-1 rounded-lg font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => cancelEdit(m.id)}
                                className="text-xs px-2 py-1 rounded-lg font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(m)}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                            Edit
                          </button>
                        )
                      )}
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
