"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  getVisibleNav,
  activeHref,
  BOTTOM_NAV_ITEMS,
} from "./nav-items";

export function MobileNav({ role }: { role: string }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const bottomItems = getVisibleNav(role, BOTTOM_NAV_ITEMS);
  const allItems = getVisibleNav(role);
  const active = activeHref(pathname, allItems);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      {/* Bottom tab bar — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-[var(--color-surface-container-lowest)] border-t border-white/10 flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {bottomItems.slice(0, 2).map((item) => (
          <TabLink key={item.href} item={item} active={active === item.href} />
        ))}

        {/* Center raised "Log Transaction" action */}
        <Link
          href="/transactions/new"
          aria-label="Log Transaction"
          className="relative flex flex-col items-center justify-center w-16"
        >
          <span className="absolute -top-5 w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-black/30">
            <span className="material-symbols-outlined text-black text-[26px]">add</span>
          </span>
          <span className="mt-9 text-[10px] font-medium text-white/60">Log</span>
        </Link>

        {bottomItems.slice(2).map((item) => (
          <TabLink key={item.href} item={item} active={active === item.href} />
        ))}

        {/* More */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="More"
          className="flex flex-col items-center justify-center gap-0.5 w-16 text-white/60"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* "More" drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[var(--color-surface-container-lowest)] pb-[env(safe-area-inset-bottom)] animate-[slideUp_0.2s_ease-out]">
            <div className="flex justify-center pt-3 pb-1">
              <span className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            <div className="px-3 py-2 space-y-0.5">
              {allItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    active === item.href
                      ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                      : "text-white/70 hover:bg-white/8"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="px-3 pb-4 pt-2 mt-1 border-t border-white/10 space-y-0.5">
              <Link
                href="/settings"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/60 hover:text-white/90 text-sm"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/60 hover:text-white/90 text-sm w-full text-left"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabLink({ item, active }: { item: { label: string; href: string; icon: string }; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex flex-col items-center justify-center gap-0.5 w-16 ${
        active ? "text-[var(--color-primary)]" : "text-white/60"
      }`}
    >
      <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
      <span className="text-[10px] font-medium">{item.label}</span>
    </Link>
  );
}
