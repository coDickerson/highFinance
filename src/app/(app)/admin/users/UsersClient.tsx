"use client";

import { useState, useRef } from "react";
import { createUser, resetPassword } from "./actions";

type Dept = { id: string; name: string; colorHex: string };
type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: { name: string; colorHex: string } | null;
  createdAt: Date;
};

const ROLE_LABELS: Record<string, string> = {
  officer: "Officer",
  executive: "Executive",
  admin: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  officer: "bg-blue-100 text-blue-800",
  executive: "bg-purple-100 text-purple-800",
  admin: "bg-amber-100 text-amber-800",
};

export function UsersClient({
  users,
  departments,
}: {
  users: UserRow[];
  departments: Dept[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [pendingCreate, setPendingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [resetPassword_, setResetPassword_] = useState("");
  const [resetPending, setResetPending] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("officer");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPendingCreate(true);
    setCreateError(null);
    try {
      const fd = new FormData(e.currentTarget);
      await createUser(fd);
      formRef.current?.reset();
      setSelectedRole("officer");
      setShowForm(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setPendingCreate(false);
    }
  }

  async function handleResetPassword(userId: string) {
    if (resetPassword_.length < 8) {
      setResetError("Password must be at least 8 characters");
      return;
    }
    setResetPending(true);
    setResetError(null);
    try {
      await resetPassword(userId, resetPassword_);
      setResetTargetId(null);
      setResetPassword_("");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setResetPending(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            User Management
          </h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
            {users.length} user{users.length !== 1 ? "s" : ""} · Add officer accounts for FA26
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #002046 0%, #1b365d 100%)" }}
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          Add Officer
        </button>
      </div>

      {/* Create user form */}
      {showForm && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
          <h3 className="font-display font-semibold text-[var(--color-on-surface)] mb-4">
            New User Account
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
                placeholder="john@example.com"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                Temporary Password
              </label>
              <input
                name="password"
                type="text"
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                Role
              </label>
              <select
                name="role"
                required
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="officer">Officer</option>
                <option value="executive">Executive</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {selectedRole === "officer" && (
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                  Officer Position
                </label>
                <select
                  name="departmentId"
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">— Unassigned —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {createError && (
              <p className="col-span-2 text-sm text-[var(--color-error)]">{createError}</p>
            )}

            <div className="col-span-2 flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => { setShowForm(false); setCreateError(null); }}
                className="px-4 py-2 rounded-xl text-sm text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pendingCreate}
                className="px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #002046 0%, #1b365d 100%)" }}
              >
                {pendingCreate ? "Creating…" : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {["User", "Email", "Role", "Position", "Created", "Actions"].map((h) => (
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
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[var(--color-surface-container-low)] transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: u.department?.colorHex ?? "#002046" }}
                    >
                      {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <p className="font-medium text-[var(--color-on-surface)]">{u.name}</p>
                  </div>
                </td>
                <td className="py-3 pr-4 text-xs text-[var(--color-on-surface-variant)]">{u.email}</td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] ?? ""}`}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td className="py-3 pr-4 text-xs text-[var(--color-on-surface-variant)]">
                  {u.department ? (
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: u.department.colorHex }}
                      />
                      {u.department.name}
                    </span>
                  ) : (
                    <span className="text-[var(--color-outline)]">—</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-xs text-[var(--color-on-surface-variant)]">
                  {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="py-3">
                  {resetTargetId === u.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={resetPassword_}
                        onChange={(e) => setResetPassword_(e.target.value)}
                        placeholder="New password"
                        className="px-2 py-1 text-xs rounded-lg bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] w-28 focus:outline-none"
                      />
                      <button
                        onClick={() => handleResetPassword(u.id)}
                        disabled={resetPending}
                        className="text-xs px-2 py-1 rounded-lg bg-[var(--color-primary)] text-white disabled:opacity-50"
                      >
                        {resetPending ? "…" : "Set"}
                      </button>
                      <button
                        onClick={() => { setResetTargetId(null); setResetError(null); setResetPassword_(""); }}
                        className="text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
                      >
                        ✕
                      </button>
                      {resetError && <span className="text-xs text-[var(--color-error)]">{resetError}</span>}
                    </div>
                  ) : (
                    <button
                      onClick={() => { setResetTargetId(u.id); setResetPassword_(""); setResetError(null); }}
                      className="text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">lock_reset</span>
                      Reset pw
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
