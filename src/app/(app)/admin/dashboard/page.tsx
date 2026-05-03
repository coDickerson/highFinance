import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { SpendingToggleChart } from "@/components/ui/SpendingToggleChart";
import { getCurrentSemester } from "@/lib/semester";
import Link from "next/link";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) redirect("/dashboard");

  const semester = getCurrentSemester();

  const [
    pendingCount,
    pendingSignups,
    paidCount,
    totalMembers,
    recentTx,
    recentStatusChanged,
    recentPendingReqs,
    recentBudgets,
    recentMembers,
    recentTransactions,
  ] = await Promise.all([
    prisma.reimbursementRequest.count({ where: { status: "pending" } }),
    prisma.signupRequest.count({ where: { status: "pending" } }),
    prisma.member.count({ where: { duesStatus: "paid" } }),
    prisma.member.count(),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { budget: { include: { department: { select: { name: true } } } } },
    }),
    prisma.reimbursementRequest.findMany({
      where: { status: { in: ["approved", "denied"] } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { submittedBy: { select: { name: true } } },
    }),
    prisma.reimbursementRequest.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { submittedBy: { select: { name: true } } },
    }),
    prisma.budget.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { department: { select: { name: true } } },
    }),
    prisma.member.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.transaction.findMany({
      where: { status: "approved" },
      orderBy: { date: "desc" },
      take: 6,
      include: {
        budget: { include: { department: { select: { name: true, colorHex: true } } } },
        submittedBy: { select: { name: true } },
      },
    }),
  ]);

  const duesCollected = paidCount * 0; // placeholder — connect to Income in C8
  const duesTarget = 500000;
  const duesPct = duesTarget > 0 ? Math.round((duesCollected / duesTarget) * 100) : 0;

  // Build notifications list from all event types
  type NotifItem = { id: string; icon: string; message: string; time: Date };
  const notifications: NotifItem[] = [
    ...recentTx.map((tx) => ({
      id: `tx-${tx.id}`,
      icon: "receipt_long",
      message: `New transaction: ${fmt(Math.abs(Number(tx.amount)))} logged to ${tx.budget.department.name}`,
      time: tx.createdAt,
    })),
    ...recentStatusChanged.map((req) => ({
      id: `req-status-${req.id}`,
      icon: req.status === "approved" ? "check_circle" : "cancel",
      message: `${req.submittedBy.name}'s ${fmt(Number(req.amount))} request was ${req.status}`,
      time: req.updatedAt,
    })),
    ...recentPendingReqs.map((req) => ({
      id: `req-new-${req.id}`,
      icon: "pending_actions",
      message: `${req.submittedBy.name} submitted a ${fmt(Number(req.amount))} reimbursement request`,
      time: req.createdAt,
    })),
    ...recentBudgets.map((b) => ({
      id: `budget-${b.id}`,
      icon: "account_balance_wallet",
      message: `Budget "${b.name}" created for ${b.department.name}`,
      time: b.createdAt,
    })),
    ...recentMembers.map((m) => ({
      id: `member-${m.id}`,
      icon: "person_add",
      message: `${m.name} was added to the roster`,
      time: m.createdAt,
    })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 8);

  // Spending chart data — last 6 months
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
  const now = new Date();
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i);
    const key = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    return { month: key, amount: monthlyMap[key] ?? 0 };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
          Admin Command Center
        </h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
          {semester} performance and member overview
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Dues Performance Hero */}
        <Link
          href="/admin/income"
          className="lg:col-span-2 rounded-2xl p-6 text-white block hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #000000 0%, #111111 100%)" }}
        >
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
            {semester} Dues Performance
          </p>
          <div className="flex items-end justify-between mb-4">
            <p className="font-display text-3xl font-extrabold">{fmt(duesCollected)}</p>
            <p className="font-display text-2xl font-bold text-white/70">{duesPct}%</p>
          </div>
          <div className="w-full h-2 rounded-full bg-white/20 mb-2">
            <div
              className="h-full rounded-full bg-[var(--color-secondary-container)]"
              style={{ width: `${Math.min(duesPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/50">
            <span>Collected: {fmt(duesCollected)}</span>
            <span>Outstanding: {fmt(duesTarget - duesCollected)}</span>
          </div>
          <p className="text-xs text-white/40 mt-3">
            {paidCount} of {totalMembers} members have paid · View Income →
          </p>
        </Link>

        {/* Pending sidebar */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 border-l-4 border-[var(--color-on-tertiary-container)] space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1">
              Pending Requests
            </p>
            <p className="font-display text-4xl font-extrabold text-[var(--color-on-surface)] mb-1">
              {pendingCount}
            </p>
            <p className="text-xs text-[var(--color-on-surface-variant)] mb-2">
              Reimbursements awaiting review
            </p>
            <Link
              href="/admin/requests"
              className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #000000 0%, #111111 100%)" }}
            >
              Review Entries →
            </Link>
          </div>
          <div className="border-t border-[var(--color-outline-variant)] pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1">
              Pending Signups
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
        {/* Spending Trends (client component for toggle) */}
        <SpendingToggleChart data={chartData} />

        {/* Notifications */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
          <h3 className="font-display font-semibold text-[var(--color-on-surface)] mb-4">
            Recent Activity
          </h3>
          {notifications.length === 0 ? (
            <p className="text-[var(--color-on-surface-variant)] text-sm">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-[15px]">
                      {n.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-on-surface)] leading-snug">{n.message}</p>
                    <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
                      {relativeTime(n.time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-[var(--color-on-surface)]">
            Recent Transactions
          </h3>
          <Link
            href="/transactions"
            className="text-xs text-[var(--color-primary)] font-medium hover:underline"
          >
            View All →
          </Link>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="text-[var(--color-on-surface-variant)] text-sm">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors border-l-4"
                style={{ borderColor: tx.budget.department.colorHex }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">
                    {tx.vendor}
                  </p>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">
                    {tx.budget.department.name} · {tx.submittedBy.name} ·{" "}
                    {new Date(tx.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <p
                  className={`font-semibold text-sm tabular-nums ${
                    Number(tx.amount) < 0
                      ? "text-[var(--color-error)]"
                      : "text-[var(--color-secondary)]"
                  }`}
                >
                  {fmt(Math.abs(Number(tx.amount)))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
