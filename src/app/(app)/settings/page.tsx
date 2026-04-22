import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">Settings</h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">Manage your account preferences</p>
      </div>
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-lg font-bold">
            {session.user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-[var(--color-on-surface)]">{session.user.name}</p>
            <p className="text-sm text-[var(--color-on-surface-variant)]">{session.user.email}</p>
            <p className="text-xs text-[var(--color-on-surface-variant)] capitalize mt-0.5">{session.user.role}</p>
          </div>
        </div>
        <div className="pt-4 border-t border-[var(--color-surface-container-high)]">
          <p className="text-xs text-[var(--color-on-surface-variant)]">Additional settings coming soon.</p>
        </div>
      </div>
    </div>
  );
}
