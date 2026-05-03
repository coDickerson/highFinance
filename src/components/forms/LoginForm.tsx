"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@org.com"
          className="w-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] text-sm px-4 py-3 rounded-xl outline-none border-b-2 border-transparent focus:border-[var(--color-primary)] transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1.5">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] text-sm px-4 py-3 rounded-xl outline-none border-b-2 border-transparent focus:border-[var(--color-primary)] transition-colors"
        />
      </div>

      {error && (
        <p className="text-[var(--color-error)] text-sm bg-[var(--color-error-container)] px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-6 rounded-xl text-black font-semibold text-sm transition-all disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #cfa126 0%, #e8b82a 100%)",
        }}
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>

      <p className="text-center text-sm text-[var(--color-on-surface-variant)]">
        New member?{" "}
        <Link href="/signup" className="text-[var(--color-primary)] font-medium hover:underline">
          Request access
        </Link>
      </p>

      {/* Demo credentials hint */}
      <div className="mt-4 rounded-xl bg-[var(--color-surface-container)] p-4 text-xs text-[var(--color-on-surface-variant)] space-y-1">
        <p className="font-semibold text-[var(--color-on-surface)] mb-2">Demo Credentials</p>
        <p>Admin: <span className="font-mono">admin@highfinance.test</span> / <span className="font-mono">Admin1234</span></p>
        <p>Executive: <span className="font-mono">exec@highfinance.test</span> / <span className="font-mono">Exec1234</span></p>
        <p>Officer: <span className="font-mono">marketing@highfinance.test</span> / <span className="font-mono">Officer1234</span></p>
      </div>
    </form>
  );
}
