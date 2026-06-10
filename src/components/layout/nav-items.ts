export type NavItem = {
  label: string;
  href: string;
  icon: string;
  minRole: number;
};

export const ROLE_RANK: Record<string, number> = {
  officer: 1,
  executive: 2,
  admin: 3,
};

// Full navigation — rendered in the desktop sidebar and the mobile "More" drawer.
// MVP scope: budget/dues bookkeeping (Fee Tracker, Roster, Income) lives in the
// spreadsheet, so those pages are intentionally not surfaced here.
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard", minRole: 1 },
  { label: "Budgets", href: "/budgets", icon: "account_balance_wallet", minRole: 1 },
  { label: "Transactions", href: "/transactions", icon: "receipt_long", minRole: 1 },
  { label: "Reimbursement Request", href: "/requests", icon: "request_page", minRole: 1 },
  { label: "Analytics", href: "/admin/analytics", icon: "analytics", minRole: 3 },
  { label: "Users", href: "/admin/users", icon: "manage_accounts", minRole: 3 },
];

export const DASHBOARD_HREF: Record<string, string> = {
  admin: "/admin/dashboard",
  executive: "/executive/dashboard",
  officer: "/officer/dashboard",
};

// Primary destinations for the mobile bottom tab bar (all officer+ visible).
// The center "Log" slot and a "More" drawer are added by the MobileNav component.
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: "dashboard", minRole: 1 },
  { label: "Budgets", href: "/budgets", icon: "account_balance_wallet", minRole: 1 },
  { label: "Requests", href: "/requests", icon: "request_page", minRole: 1 },
];

/** Role-filtered nav with the generic "/dashboard" entry resolved to the role's dashboard. */
export function getVisibleNav(role: string, items: NavItem[] = NAV_ITEMS): NavItem[] {
  const rank = ROLE_RANK[role] ?? 1;
  const dashboardHref = DASHBOARD_HREF[role] ?? "/officer/dashboard";
  return items
    .filter((item) => rank >= item.minRole)
    .map((item) =>
      item.href === "/dashboard" ? { ...item, href: dashboardHref } : item
    );
}

/** Longest-prefix match so a nested route highlights its closest nav item. */
export function activeHref(pathname: string, items: NavItem[]): string | undefined {
  return items
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}
