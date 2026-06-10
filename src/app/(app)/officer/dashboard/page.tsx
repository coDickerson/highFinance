import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { getCurrentSemester } from "@/lib/semester";
import { getPlannedBudgetMap, resolvePosition } from "@/lib/ledger";
import Link from "next/link";
function fmt(n: { toFixed?: (d: number) => string } | number | string) {
  return Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function OfficerDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const semester = getCurrentSemester();

  // Fetch all departments this officer is assigned to (primary + extra)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      department: true,
      userDepartments: { include: { department: true } },
    },
  });

  const deptIds = user
    ? Array.from(
        new Set([
          ...(user.departmentId ? [user.departmentId] : []),
          ...user.userDepartments.map((ud) => ud.departmentId),
        ])
      )
    : [];

  const budgets = deptIds.length > 0
    ? await prisma.budget.findMany({
        where: { departmentId: { in: deptIds }, status: "active" },
        orderBy: [{ year: "desc" }, { semester: "desc" }],
        include: {
          department: true,
          transactions: {
            orderBy: { date: "desc" },
            include: { submittedBy: { select: { name: true } } },
          },
        },
      })
    : [];

  // Budget totals come from the spreadsheet's Officer Allocations tab (source of
  // truth); fall back to the DB amount only if a position isn't found there.
  const plannedMap = await getPlannedBudgetMap();
  const budgetTotal = (b: { department: { name: string }; totalAmount: unknown }) => {
    const pos = resolvePosition(b.department.name);
    const planned = pos ? plannedMap.get(pos) : undefined;
    return planned && planned > 0 ? planned : Number(b.totalAmount);
  };

  const [pendingCount, recentRequests] = await Promise.all([
    prisma.reimbursementRequest.count({
      where: { submittedById: session.user.id, status: "pending" },
    }),
    prisma.reimbursementRequest.findMany({
      where: { submittedById: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  // Merge recent transactions (across all budgets) + recent requests into one activity feed
  const allTxs = budgets.flatMap((b) => b.transactions);
  allTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentTxs = allTxs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
          Welcome back, {session.user.name?.split(" ")[0]}
        </h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
          {budgets.length > 0 ? `${budgets.map(b => b.department.name).join(" & ")} budget${budgets.length > 1 ? "s" : ""}` : "Your budgets"} · {semester}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Budget cards — all active budgets */}
        <div className="lg:col-span-2 space-y-5">
          {budgets.length === 0 ? (
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
              <p className="text-[var(--color-on-surface-variant)] text-sm">
                No active budget assigned. Contact your administrator.
              </p>
            </div>
          ) : (
            budgets.map((b) => {
              const bTotal = budgetTotal(b);
              const bSpent = b.transactions.filter((t) => t.status === "approved").reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
              const bAvail = bTotal - bSpent;
              const bPct = bTotal > 0 ? Math.round((bSpent / bTotal) * 100) : 0;
              return (
                <Link key={b.id} href="/budgets" className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 block hover:bg-[var(--color-surface-container-low)] transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1">
                        {b.department.name}
                      </p>
                      <h3 className="font-display text-xl font-bold text-[var(--color-on-surface)]">{b.name}</h3>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="flex items-end gap-6 mb-4">
                    <div>
                      <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Available Balance</p>
                      <p className="font-display text-3xl font-extrabold text-[var(--color-on-surface)]">{fmt(bAvail)}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Total Budget</p>
                      <p className="font-display text-lg font-semibold text-[var(--color-on-surface-variant)]">{fmt(bTotal)}</p>
                    </div>
                  </div>
                  <ProgressBar value={bSpent} max={bTotal} />
                  <div className="flex justify-between mt-1.5 text-xs text-[var(--color-on-surface-variant)]">
                    <span>{bPct}% Utilized</span>
                    <span>{fmt(bAvail)} remaining</span>
                  </div>
                </Link>
              );
            })
          )}

          {/* Recent Activity — transactions + reimbursement requests */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-[var(--color-on-surface)]">
                Recent Activity
              </h3>
              <Link href="/transactions" className="text-xs text-[var(--color-primary)] font-medium hover:underline">
                View All →
              </Link>
            </div>

            {recentTxs.length === 0 && recentRequests.length === 0 ? (
              <p className="text-[var(--color-on-surface-variant)] text-sm">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {recentTxs.map((tx) => (
                  <div key={`tx-${tx.id}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-container)] flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-[18px]">receipt</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">{tx.vendor}</p>
                      <p className="text-xs text-[var(--color-on-surface-variant)]">
                        Transaction · {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <StatusBadge status={tx.status} />
                    <p className={`font-semibold text-sm tabular-nums w-24 text-right ${Number(tx.amount) < 0 ? "text-[var(--color-error)]" : "text-[var(--color-secondary)]"}`}>
                      {fmt(Math.abs(Number(tx.amount)))}
                    </p>
                  </div>
                ))}
                {recentRequests.map((req) => (
                  <Link key={`req-${req.id}`} href={`/requests/${req.id}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-container)] flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-[18px]">request_page</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">{req.description}</p>
                      <p className="text-xs text-[var(--color-on-surface-variant)]">
                        Reimbursement · {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <StatusBadge status={req.status} />
                    <p className="font-semibold text-sm tabular-nums w-24 text-right text-[var(--color-on-surface)]">
                      {fmt(Number(req.amount))}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "linear-gradient(160deg, #000000 0%, #111111 100%)" }}>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Quick Actions</p>
            {[
              { label: "Upload Receipt", icon: "upload_file", href: "/transactions/new" },
              { label: "Request Reimbursement", icon: "request_page", href: "/requests/new" },
            ].map(({ label, icon, href }) => (
              <Link key={label} href={href} className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[16px]">{icon}</span>
                </div>
                <span className="text-white text-sm font-medium">{label}</span>
              </Link>
            ))}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Budgets" value={budgets.length} sub="active" />
            <MetricCard label="Pending" value={pendingCount} sub="requests" />
          </div>
        </div>
      </div>
    </div>
  );
}
