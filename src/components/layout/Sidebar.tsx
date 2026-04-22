"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  minRole: number;
};

const ROLE_RANK: Record<string, number> = { officer: 1, executive: 2, admin: 3 };

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard", minRole: 1 },
  { label: "Budgets", href: "/budgets", icon: "account_balance_wallet", minRole: 1 },
  { label: "Transactions", href: "/transactions", icon: "receipt_long", minRole: 1 },
  { label: "Reimbursement Request", href: "/requests", icon: "request_page", minRole: 1 },
  { label: "Analytics", href: "/admin/analytics", icon: "analytics", minRole: 3 },
  { label: "Memberships", href: "/admin/signups", icon: "person_add", minRole: 3 },
  { label: "Income", href: "/admin/income", icon: "payments", minRole: 3 },
  { label: "Users", href: "/admin/users", icon: "manage_accounts", minRole: 3 },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const rank = ROLE_RANK[role] ?? 1;

  const visibleItems = NAV_ITEMS.filter((item) => rank >= item.minRole);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[var(--color-primary)] flex flex-col z-40">
      {/* Branding */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-base">account_balance</span>
          </div>
          <div>
            <p className="text-white font-display font-bold text-sm leading-tight">Treasury Portal</p>
            <p className="text-white/50 text-xs capitalize">{role} Access</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? "bg-white/15 text-white translate-x-0.5 border-r-2 border-white"
                  : "text-white/60 hover:bg-white/8 hover:text-white/90"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Universal Entry CTA */}
      <div className="px-3 pb-4">
        <Link
          href="/transactions/new"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-white/15 hover:bg-white/20 text-white text-sm font-semibold transition-all"
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
