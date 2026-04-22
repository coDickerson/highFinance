"use client";

import { useState } from "react";
import Link from "next/link";

interface Department {
  id: string;
  name: string;
}

interface Props {
  departments: Department[];
}

export function SignupForm({ departments }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, departmentId: departmentId || null }),
    });

    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[var(--color-primary)] text-[32px]">check_circle</span>
        </div>
        <div>
          <p className="font-display font-bold text-[var(--color-on-surface)] text-lg">Request submitted</p>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">
            An admin will review your request. You'll be notified when it's approved.
          </p>
        </div>
        <Link
          href="/login"
          className="block text-center text-sm text-[var(--color-primary)] font-medium hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] text-sm px-4 py-3 rounded-xl outline-none border-b-2 border-transparent focus:border-[var(--color-primary)] transition-colors";
  const labelClass =
    "block text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Jane Smith"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@org.com"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Department</label>
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className={inputClass + " cursor-pointer"}
        >
          <option value="">Select a department…</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-[var(--color-error)] text-sm bg-[var(--color-error-container)] px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-6 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #002046 0%, #1b365d 100%)" }}
      >
        {loading ? "Submitting…" : "Request Access"}
      </button>

      <p className="text-center text-sm text-[var(--color-on-surface-variant)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--color-primary)] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
