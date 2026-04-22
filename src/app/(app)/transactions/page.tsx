import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function TransactionsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isExecOrAbove = hasMinRole(session.user.role, "executive");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { department: { select: { name: true } } },
  });

  // Execs and admins see all transactions; officers see their department's
  const where = isExecOrAbove
    ? {}
    : user?.departmentId
    ? { budget: { departmentId: user.departmentId } }
    : { submittedById: session.user.id }; // fallback if no dept assigned

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      budget: { include: { department: true } },
      submittedBy: { select: { name: true } },
    },
  });

  // Officers with no department can't add; everyone else can
  const canAdd = isExecOrAbove || !!user?.departmentId;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Transactions
          </h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
            {transactions.length} record{transactions.length !== 1 ? "s" : ""}
            {!isExecOrAbove && user?.department ? ` · ${user.department.name}` : ""}
          </p>
        </div>
        {canAdd && (
          <Link
            href="/transactions/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #002046 0%, #1b365d 100%)" }}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Transaction
          </Link>
        )}
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
        <div className="space-y-2">
          {transactions.length === 0 && (
            <p className="text-[var(--color-on-surface-variant)] text-sm">No transactions yet.</p>
          )}
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors border-l-4"
              style={{ borderLeftColor: tx.budget.department.colorHex }}
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
                  Added by {tx.submittedBy.name} · {tx.budget.department.name} · {tx.category} ·{" "}
                  {new Date(tx.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <StatusBadge status={tx.status} />
              <p
                className={`font-semibold text-sm tabular-nums w-28 text-right ${
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
      </div>
    </div>
  );
}
