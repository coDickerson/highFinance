"use client";

import { useSession } from "next-auth/react";

export function TopHeader({ title = "Fiscal Architect" }: { title?: string }) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-[var(--color-surface-container-lowest)] z-30 flex items-center px-4 md:px-6 gap-4">
      <div className="flex-1 flex items-center gap-2.5">
        {/* Brand mark — shown on mobile where the sidebar is hidden */}
        <div className="md:hidden w-8 h-8 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[var(--color-primary)] text-base">account_balance</span>
        </div>
        <h1 className="font-display font-bold text-[var(--color-on-surface)] text-base">
          {title}
        </h1>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-2.5 ml-1">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-[var(--color-on-surface)] leading-tight">
            {name}
          </p>
          <p className="text-xs text-[var(--color-on-surface-variant)] capitalize">
            {session?.user?.role}
          </p>
        </div>
        <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-black text-sm font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
}
