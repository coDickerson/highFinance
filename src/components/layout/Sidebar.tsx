"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { getVisibleNav, activeHref } from "./nav-items";

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const visibleItems = getVisibleNav(role);
  const active = activeHref(pathname, visibleItems);

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-[var(--color-surface-container-lowest)] flex-col z-40">
      {/* Branding */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-base">account_balance</span>
          </div>
          <div>
            <p className="text-white font-display font-bold text-sm leading-tight">Treasury Portal</p>
            <p className="text-white/50 text-xs capitalize">{role} Access</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
              active === item.href
                ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)] translate-x-0.5 border-r-2 border-[var(--color-primary)]"
                : "text-white/60 hover:bg-white/8 hover:text-white/90"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Universal Entry CTA */}
      <div className="px-3 pb-4">
        <Link
          href="/transactions/new"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-black text-sm font-semibold transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Log Transaction
        </Link>
      </div>

      {/* Footer */}
      <div className="px-3 pb-5 space-y-0.5 border-t border-white/10 pt-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white/80 text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
          Settings
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white/80 text-sm transition-colors w-full text-left"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
