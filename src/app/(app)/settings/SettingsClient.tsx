"use client";

import { useState } from "react";
import { resetOwnPassword, deleteOwnAccount } from "./actions";

interface Props {
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

export function SettingsClient({ name, email, role, isAdmin }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [resetPending, setResetPending] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const inputClass =
    "w-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] text-sm px-4 py-3 rounded-xl outline-none border-b-2 border-transparent focus:border-[var(--color-primary)] transition-colors";

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { setResetError("Passwords do not match"); return; }
    setResetPending(true);
    setResetError(null);
    try {
      await resetOwnPassword(currentPw, newPw);
      setResetSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => { setResetSuccess(false); setShowResetForm(false); }, 2000);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setResetPending(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    setDeletePending(true);
    try {
      await deleteOwnAccount();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete account");
      setDeletePending(false);
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">Settings</h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">Manage your account</p>
      </div>

      {/* Profile Info */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-[var(--color-outline-variant)]">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-black text-lg font-bold flex-shrink-0">
            {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-[var(--color-on-surface)]">{name}</p>
            <p className="text-sm text-[var(--color-on-surface-variant)]">{email}</p>
            <span className="inline-block mt-1 text-xs font-semibold capitalize px-2 py-0.5 rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]">
              {role}
            </span>
          </div>
        </div>

        {/* Field rows */}
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)]">Name</span>
            <span className="text-sm text-[var(--color-on-surface)]">{name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-[var(--color-outline-variant)]">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)]">Email</span>
            <span className="text-sm text-[var(--color-on-surface)]">{email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-[var(--color-outline-variant)]">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)]">Role</span>
            <span className="text-sm text-[var(--color-on-surface)] capitalize">{role}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-[var(--color-outline-variant)]">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)]">Password</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-on-surface)] font-mono tracking-widest">
                {showPassword ? "••••••••••" : "••••••••••"}
              </span>
              <button
                onClick={() => setShowPassword((v) => !v)}
                className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
                title="Password is stored securely and cannot be displayed"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Password */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-[var(--color-on-surface)]">Reset Password</h3>
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">Choose a new password for your account</p>
          </div>
          <button
            onClick={() => { setShowResetForm((v) => !v); setResetError(null); }}
            className="text-xs text-[var(--color-primary)] font-medium hover:underline"
          >
            {showResetForm ? "Cancel" : "Change Password"}
          </button>
        </div>

        {showResetForm && (
          <form onSubmit={handleReset} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1.5">Current Password</label>
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required className={inputClass} placeholder="Enter current password" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1.5">New Password</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} className={inputClass} placeholder="Min. 8 characters" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1.5">Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required className={inputClass} placeholder="Repeat new password" />
            </div>
            {resetError && <p className="text-[var(--color-error)] text-sm">{resetError}</p>}
            {resetSuccess && <p className="text-[var(--color-secondary)] text-sm">Password updated successfully.</p>}
            <button
              type="submit"
              disabled={resetPending}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #000000 0%, #111111 100%)" }}
            >
              {resetPending ? "Updating…" : "Update Password"}
            </button>
          </form>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 border border-[var(--color-error)]/20">
        <h3 className="font-display font-semibold text-[var(--color-error)] mb-1">Danger Zone</h3>
        <p className="text-xs text-[var(--color-on-surface-variant)] mb-4">
          {isAdmin
            ? "Admin accounts cannot be deleted. To transfer ownership, create a new admin account and have the outgoing treasurer removed by the new admin."
            : "Permanently delete your account. This action cannot be undone."}
        </p>
        <button
          onClick={handleDelete}
          disabled={isAdmin || deletePending}
          title={isAdmin ? "Admin accounts cannot be deleted" : undefined}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[var(--color-error)] bg-[var(--color-error-container)] hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[16px]">delete_forever</span>
          {deletePending ? "Deleting…" : "Delete My Account"}
        </button>
      </div>
    </div>
  );
}
