import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { BudgetCard } from "@/components/ui/BudgetCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function ExecutiveDashboardPage() {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "executive")) redirect("/dashboard");

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
            Real-time treasury metrics for Fiscal Year 2024
          </p>
        </div>
        <Link
          href="/transactions/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors"
          style={{ background: "linear-gradient(135deg, #002046 0%, #1b365d 100%)" }}
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Receipt
        </Link>
      </div>

      {/* Hero — consolidated assets */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #002046 0%, #1b365d 100%)" }}
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">
              Total Consolidated Assets
            </p>
            <p className="font-display text-4xl font-extrabold">
              {fmt(totalAssets)}
            </p>
            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-white/50 text-xs">Liquid Cash</p>
                <p className="font-semibold">{fmt(totalAssets - totalSpent)}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Committed</p>
                <p className="font-semibold">{fmt(totalSpent * 0.7)}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Pending Approval</p>
                <p className="font-semibold">{fmt(totalSpent * 0.3)}</p>
              </div>
            </div>
          </div>

          {/* Monthly run-rate mini */}
          <div className="bg-white/10 rounded-xl p-4 lg:w-56">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
              Monthly Run-Rate
            </p>
            <p className="font-display text-2xl font-bold">{fmt(totalSpent / 10)}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]">
              Stable
            </span>
          </div>
        </div>
      </div>

      {/* Department Budgets */}
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
          <button className="rounded-2xl border-2 border-dashed border-[var(--color-surface-container-high)] hover:border-[var(--color-primary)] transition-colors p-6 flex flex-col items-center justify-center gap-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]">
            <span className="material-symbols-outlined text-[28px]">add_circle</span>
            <span className="text-sm font-medium">New Department</span>
          </button>
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
          <button className="mt-4 w-full text-center text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors font-medium py-2">
            Download Full Ledger Report (PDF)
          </button>
        </div>
      )}
    </div>
  );
}
