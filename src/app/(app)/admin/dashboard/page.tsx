import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SpendingChart } from "@/components/ui/SpendingChart";
import Link from "next/link";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) redirect("/dashboard");

  const pendingCount = await prisma.reimbursementRequest.count({ where: { status: "pending" } });
  const pendingSignups = await prisma.signupRequest.count({ where: { status: "pending" } });

  const members = await prisma.member.findMany({ orderBy: { name: "asc" }, take: 10 });
  const paidCount = members.filter((m) => m.duesStatus === "paid").length;
  const totalMembers = await prisma.member.count();
  const duesCollected = 428500;
  const duesTarget = 500000;
  const duesPct = Math.round((duesCollected / duesTarget) * 100);

  const recentLogs = await prisma.activityLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 5,
    include: { user: { select: { name: true, role: true } } },
  });

  // Spending by month (last 6 months) — aggregate
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const txByMonth = await prisma.transaction.findMany({
    where: { date: { gte: sixMonthsAgo }, status: "approved" },
    select: { date: true, amount: true },
  });

  const monthlyMap: Record<string, number> = {};
  for (const tx of txByMonth) {
    const key = new Date(tx.date).toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    monthlyMap[key] = (monthlyMap[key] ?? 0) + Math.abs(Number(tx.amount));
  }
  const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const now = new Date();
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i);
    const key = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    return { month: key, amount: monthlyMap[key] ?? 0 };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Admin Command Center
          </h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
            Q3 performance, security, and member overview
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Dues Performance Hero */}
        <div
          className="lg:col-span-2 rounded-2xl p-6 text-white"
          style={{ background: "linear-gradient(135deg, #002046 0%, #1b365d 100%)" }}
        >
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
            Q3 Dues Performance
          </p>
          <div className="flex items-end justify-between mb-4">
            <p className="font-display text-3xl font-extrabold">{fmt(duesCollected)}</p>
            <p className="font-display text-2xl font-bold text-white/70">{duesPct}%</p>
          </div>
          <div className="w-full h-2 rounded-full bg-white/20 mb-2">
            <div
              className="h-full rounded-full bg-[var(--color-secondary-container)]"
              style={{ width: `${duesPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/50">
            <span>Collected: {fmt(duesCollected)}</span>
            <span>Outstanding: {fmt(duesTarget - duesCollected)}</span>
          </div>
        </div>

        {/* Pending requests */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 border-l-4 border-[var(--color-on-tertiary-container)] space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1">
              Pending Requests
            </p>
            <p className="font-display text-4xl font-extrabold text-[var(--color-on-surface)] mb-1">
              {pendingCount}
            </p>
            <p className="text-xs text-[var(--color-on-surface-variant)] mb-2">
              Approval delegation requested
            </p>
            <Link
              href="/admin/requests"
              className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #002046 0%, #1b365d 100%)" }}
            >
              Review Entries →
            </Link>
          </div>
          <div className="border-t border-[var(--color-outline-variant)] pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1">
              Pending Memberships
            </p>
            <p className="font-display text-3xl font-extrabold text-[var(--color-on-surface)] mb-1">
              {pendingSignups}
            </p>
            <p className="text-xs text-[var(--color-on-surface-variant)] mb-2">
              Awaiting account approval
            </p>
            <Link
              href="/admin/signups"
              className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl text-sm font-semibold bg-[var(--color-surface-container)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-colors"
            >
              Review Signups →
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Spending Trends */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-[var(--color-on-surface)]">
              Spending Trends
            </h3>
            <div className="flex gap-1">
              {["Monthly", "Quarterly"].map((v) => (
                <button
                  key={v}
                  className="text-xs px-3 py-1 rounded-lg bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <SpendingChart data={chartData} />
        </div>

        {/* Security Log */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-[var(--color-on-surface)]">
              Security Log
            </h3>
            <button className="text-xs text-[var(--color-primary)] font-medium hover:underline">
              View Full Audit
            </button>
          </div>
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-[16px]">
                    {log.action === "login" ? "verified_user" : "person"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">
                    {log.user.name}
                  </p>
                  <p className="text-xs text-[var(--color-on-surface-variant)] capitalize">
                    {log.user.role} · {log.action.replace("_", " ")}
                  </p>
                </div>
                <p className="text-xs text-[var(--color-on-surface-variant)] flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Member Roster */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-[var(--color-on-surface)]">
              Member Roster
            </h3>
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
              Managing {totalMembers} active organization members
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/members"
              className="text-xs px-3 py-2 rounded-lg bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors font-medium"
            >
              Filter
            </Link>
            <button className="text-xs px-3 py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium">
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                {["Member", "Contact Info", "Dues Status", "Last Activity"].map((h) => (
                  <th
                    key={h}
                    className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] pb-3 pr-4"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr
                  key={m.id}
                  className="hover:bg-[var(--color-surface-container-low)] transition-colors"
                >
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-on-surface)]">{m.name}</p>
                        <p className="text-xs text-[var(--color-on-surface-variant)]">
                          Pledge Class {m.tier}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <p className="text-[var(--color-on-surface-variant)] text-xs">{m.email}</p>
                    {m.phone && (
                      <p className="text-[var(--color-on-surface-variant)] text-xs">{m.phone}</p>
                    )}
                  </td>
                  <td className="py-2.5 pr-4">
                    <StatusBadge status={m.duesStatus} />
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-[var(--color-on-surface-variant)]">
                    {m.lastPayment
                      ? `Last payment ${new Date(m.lastPayment).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
