import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import Link from "next/link";
function fmt(n: { toFixed?: (d: number) => string } | number | string) {
  return Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function OfficerDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { department: true },
  });

  const budget = user?.departmentId
    ? await prisma.budget.findFirst({
        where: { departmentId: user.departmentId, status: "active" },
        orderBy: [{ year: "desc" }, { semester: "desc" }],
        include: {
          transactions: {
            orderBy: { date: "desc" },
            take: 5,
            include: { submittedBy: { select: { name: true } } },
          },
        },
      })
    : null;

  const spent = budget
    ? budget.transactions
        .filter((t) => t.status === "approved")
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
    : 0;

  const available = budget ? Number(budget.totalAmount) - spent : 0;
  const utilPct = budget ? Math.round((spent / Number(budget.totalAmount)) * 100) : 0;

  const pendingCount = await prisma.reimbursementRequest.count({
    where: { submittedById: session.user.id, status: "pending" },
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
          Welcome back, {session.user.name?.split(" ")[0]}
        </h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
          {user?.department?.name ?? "Your"} budget overview for FY2024
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Budget card — main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Current Allocation */}
          {budget ? (
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1">
                    Current Allocation
                  </p>
                  <h3 className="font-display text-xl font-bold text-[var(--color-on-surface)]">
                    {budget.name}
                  </h3>
                </div>
                <StatusBadge status={budget.status} />
              </div>

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
                    {fmt(budget.totalAmount)}
                  </p>
                </div>
              </div>

              <ProgressBar value={spent} max={Number(budget.totalAmount)} />
              <div className="flex justify-between mt-1.5 text-xs text-[var(--color-on-surface-variant)]">
                <span>{utilPct}% Utilized</span>
                <span>{fmt(available)} remaining</span>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
              <p className="text-[var(--color-on-surface-variant)] text-sm">
                No active budget assigned. Contact your administrator.
              </p>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-[var(--color-on-surface)]">
                Recent Activity
              </h3>
              <Link
                href="/transactions"
                className="text-xs text-[var(--color-primary)] font-medium hover:underline"
              >
                View All Transactions →
              </Link>
            </div>

            {budget?.transactions.length ? (
              <div className="space-y-3">
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
                        Added by {tx.submittedBy.name} ·{" "}
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
                      {fmt(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[var(--color-on-surface-variant)] text-sm">No transactions yet.</p>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: "linear-gradient(160deg, #002046 0%, #1b365d 100%)" }}
          >
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
              Quick Actions
            </p>
            {[
              { label: "Upload Receipt", icon: "upload_file", href: "/transactions/new" },
              { label: "Request Reimbursement", icon: "request_page", href: "/requests/new" },
            ].map(({ label, icon, href }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[16px]">{icon}</span>
                </div>
                <span className="text-white text-sm font-medium">{label}</span>
              </Link>
            ))}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Avg Response" value="4.2h" sub="↑ 12% faster" />
            <MetricCard label="Pending" value={pendingCount} sub="approvals" />
          </div>
        </div>
      </div>
    </div>
  );
}
