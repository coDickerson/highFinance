import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const { id } = await params;

  const budget = await prisma.budget.findUnique({
    where: { id },
    include: {
      department: true,
      transactions: { orderBy: { date: "desc" } },
    },
  });

  if (!budget) notFound();

  const spent = budget.transactions
    .filter((t) => t.status === "approved")
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const available = Number(budget.totalAmount) - spent;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/budgets" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[var(--color-on-surface)]">{budget.name}</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm">{budget.department.name} · FY{budget.year}</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
        <div className="flex items-end gap-6 mb-4">
          <div>
            <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Available</p>
            <p className="font-display text-3xl font-extrabold">{fmt(available)}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Total Budget</p>
            <p className="font-display text-lg font-semibold text-[var(--color-on-surface-variant)]">{fmt(Number(budget.totalAmount))}</p>
          </div>
        </div>
        <ProgressBar value={spent} max={Number(budget.totalAmount)} />
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">All Transactions</h3>
          <Link href="/transactions/new" className="text-xs text-[var(--color-primary)] font-medium hover:underline">
            + Add Transaction
          </Link>
        </div>
        <div className="space-y-2">
          {budget.transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">{tx.vendor}</p>
                <p className="text-xs text-[var(--color-on-surface-variant)]">{tx.category} · {new Date(tx.date).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={tx.status} />
              <p className={`font-semibold text-sm tabular-nums w-24 text-right ${Number(tx.amount) < 0 ? "text-[var(--color-error)]" : "text-[var(--color-secondary)]"}`}>
                {fmt(Number(tx.amount))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
