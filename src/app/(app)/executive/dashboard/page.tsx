import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { BudgetCard } from "@/components/ui/BudgetCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCurrentSemester, getCalendarYear } from "@/lib/semester";
import Link from "next/link";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function ExecutiveDashboardPage() {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "executive")) redirect("/dashboard");

  const semester = getCurrentSemester();
  const calYear = getCalendarYear();

  const departments = await prisma.department.findMany({
    include: {
      budgets: {
        where: { status: "active" },
        include: { transactions: true },
      },
    },
  });

  const allBudgets = departments.flatMap((d) =>
    d.budgets.map((b) => {
      const spent = b.transactions
        .filter((t) => t.status === "approved")
        .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
      return {
        id: b.id,
        name: d.name,
        description: d.description ?? undefined,
        colorHex: d.colorHex,
        totalAmount: Number(b.totalAmount),
        spent,
        transactionCount: b.transactions.length,
      };
    })
  );

  const totalAssets = allBudgets.reduce((s, b) => s + b.totalAmount, 0);
  const totalSpent = allBudgets.reduce((s, b) => s + b.spent, 0);

  const calYearBudgets = await prisma.budget.findMany({
    where: { year: calYear.year },
    include: { transactions: { where: { status: "approved" } } },
  });
  const calYearAllocated = calYearBudgets.reduce((s, b) => s + Number(b.totalAmount), 0);
  const calYearSpent = calYearBudgets.reduce(
    (s, b) => s + b.transactions.reduce((ts, t) => ts + Math.abs(Number(t.amount)), 0),
    0
  );
  const calYearPct = calYearAllocated > 0 ? Math.round((calYearSpent / calYearAllocated) * 100) : 0;

  const pendingApprovals = await prisma.reimbursementRequest.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      submittedBy: { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Executive Overview
          </h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
            Real-time treasury metrics · {semester}
          </p>
        </div>
        <Link
          href="/transactions/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors"
          style={{ background: "linear-gradient(135deg, #000000 0%, #111111 100%)" }}
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Receipt
        </Link>
      </div>

      {/* Calendar Year Budget Hero */}
      <Link
        href="/budgets"
        className="rounded-2xl p-6 text-white block hover:opacity-90 transition-opacity"
        style={{ background: "linear-gradient(135deg, #000000 0%, #111111 100%)" }}
      >
        <div className="flex items-start justify-between mb-1">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">
            {calYear.label} Calendar Year Budget
          </p>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/60">
            SP{String(calYear.year).slice(2)} + FA{String(calYear.year).slice(2)}
          </span>
        </div>
        <div className="flex items-end justify-between mb-4 mt-2">
          <div>
            <p className="text-white/50 text-xs mb-0.5">Total Allocated</p>
            <p className="font-display text-4xl font-extrabold">{fmt(calYearAllocated)}</p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-xs mb-0.5">Spent</p>
            <p className="font-display text-2xl font-bold text-white/70">{fmt(calYearSpent)}</p>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-white/20 mb-2">
          <div
            className="h-full rounded-full bg-[var(--color-secondary-container)]"
            style={{ width: `${Math.min(calYearPct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/50">
          <span>{calYearPct}% utilized · {fmt(calYearAllocated - calYearSpent)} remaining</span>
          <span>{calYearBudgets.length} budget{calYearBudgets.length !== 1 ? "s" : ""} · View Budgets →</span>
        </div>
      </Link>

      {/* Active Department Budgets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-[var(--color-on-surface)]">
            Department Budgets
          </h3>
          <Link
            href="/budgets"
            className="text-xs text-[var(--color-primary)] font-medium hover:underline"
          >
            View All Departments →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {allBudgets.map((b) => (
            <BudgetCard key={b.id} {...b} />
          ))}
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-[var(--color-on-surface)]">
              Pending Approvals
            </h3>
            <Link
              href="/admin/requests"
              className="text-xs text-[var(--color-primary)] font-medium hover:underline"
            >
              Filter Ledger →
            </Link>
          </div>
          <div className="space-y-3">
            {pendingApprovals.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-container)] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-[18px]">
                    request_page
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">
                    {req.description}
                  </p>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">
                    {req.department.name} · {req.submittedBy.name}
                  </p>
                </div>
                <StatusBadge status={req.status} />
                <p className="font-semibold text-sm tabular-nums text-[var(--color-on-surface)]">
                  {fmt(Number(req.amount))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
