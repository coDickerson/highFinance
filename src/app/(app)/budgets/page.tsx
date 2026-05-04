import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BudgetsAdminClient } from "./BudgetsAdminClient";
import Link from "next/link";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function semesterLabel(s: string, y: number) {
  return `${s === "fall" ? "FA" : "SP"}${String(y).slice(2)}`;
}

export default async function BudgetsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isExecOrAbove = hasMinRole(session.user.role, "executive");
  const isAdmin = hasMinRole(session.user.role, "admin");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { department: true },
  });

  // ── Exec / Admin: card-grid with inline drawer ──────────────────────────────
  if (isExecOrAbove) {
    const departments = await prisma.department.findMany({
      include: {
        budgets: {
          where: { status: "active" },
          include: { transactions: { orderBy: { date: "desc" } } },
          orderBy: [{ year: "desc" }, { semester: "desc" }],
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    const budgets = departments.flatMap((d) =>
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
          semester: semesterLabel(b.semester, b.year),
          transactions: b.transactions.map((t) => ({
            id: t.id,
            vendor: t.vendor,
            category: t.category,
            amount: Number(t.amount),
            date: t.date.toISOString(),
            status: t.status as string,
          })),
        };
      })
    );

    const allDepts = isAdmin
      ? await prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
      : [];

    return (
      <BudgetsAdminClient budgets={budgets} departments={allDepts} isAdmin={isAdmin} />
    );
  }

  // ── Officer: expanded single-budget view ────────────────────────────────────
  const budget = user?.departmentId
    ? await prisma.budget.findFirst({
        where: { departmentId: user.departmentId, status: "active" },
        include: {
          department: true,
          transactions: {
            orderBy: { date: "desc" },
            include: { submittedBy: { select: { name: true } } },
          },
        },
        orderBy: [{ year: "desc" }, { semester: "desc" }],
      })
    : null;

  if (!budget) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            My Budget
          </h2>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-4xl mb-3 block">
            account_balance_wallet
          </span>
          <p className="text-[var(--color-on-surface)] font-medium mb-1">No active budget assigned</p>
          <p className="text-[var(--color-on-surface-variant)] text-sm">
            Contact your treasurer to set up your FA26 budget.
          </p>
        </div>
      </div>
    );
  }

  const spent = budget.transactions
    .filter((t) => t.status === "approved")
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const available = Number(budget.totalAmount) - spent;
  const utilPct = Math.round((spent / Number(budget.totalAmount)) * 100);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
          {budget.name}
        </h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
          {budget.department.name} · {semesterLabel(budget.semester, budget.year)}
        </p>
      </div>

      {/* Budget summary */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
        <div className="flex items-end gap-6 mb-4">
          <div>
            <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Available Balance</p>
            <p className="font-display text-3xl font-extrabold text-[var(--color-on-surface)]">
              {fmt(available)}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Total Budget</p>
            <p className="font-display text-lg font-semibold text-[var(--color-on-surface-variant)]">
              {fmt(Number(budget.totalAmount))}
            </p>
          </div>
        </div>
        <ProgressBar value={spent} max={Number(budget.totalAmount)} />
        <div className="flex justify-between mt-1.5 text-xs text-[var(--color-on-surface-variant)]">
          <span>{utilPct}% utilized</span>
          <span>{fmt(available)} remaining</span>
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-[var(--color-on-surface)]">
            All Transactions
          </h3>
          <Link
            href="/transactions/new"
            className="text-xs text-[var(--color-primary)] font-medium hover:underline"
          >
            + Add Transaction
          </Link>
        </div>

        {budget.transactions.length === 0 ? (
          <p className="text-[var(--color-on-surface-variant)] text-sm">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {budget.transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-container)] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-[18px]">
                    receipt
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">
                    {tx.vendor}
                  </p>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">
                    Added by {tx.submittedBy.name} · {tx.category} ·{" "}
                    {new Date(tx.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <StatusBadge status={tx.status} />
                <p
                  className={`font-semibold text-sm tabular-nums w-24 text-right ${
                    Number(tx.amount) < 0
                      ? "text-[var(--color-error)]"
                      : "text-[var(--color-secondary)]"
                  }`}
                >
                  {fmt(Number(tx.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
