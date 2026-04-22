import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { SpendingChart } from "@/components/ui/SpendingChart";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) redirect("/dashboard");

  // Login frequency per user
  const loginStats = await prisma.activityLog.groupBy({
    by: ["userId"],
    where: { action: "login" },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const userIds = loginStats.map((s) => s.userId);
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  // Avg session duration
  const sessionLogs = await prisma.activityLog.aggregate({
    where: { action: "logout", sessionDuration: { not: null } },
    _avg: { sessionDuration: true },
  });
  const avgSession = Math.round((sessionLogs._avg.sessionDuration ?? 0) / 60);

  // Spending trend
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
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">Analytics</h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">Usage patterns and spending trends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: users.length },
          { label: "Avg Session", value: `${avgSession}m` },
          { label: "Active Logins", value: loginStats.reduce((s, l) => s + l._count.id, 0) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1">{label}</p>
            <p className="font-display text-3xl font-extrabold text-[var(--color-on-surface)]">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
        <h3 className="font-display font-semibold text-[var(--color-on-surface)] mb-4">Monthly Spending</h3>
        <SpendingChart data={chartData} />
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
        <h3 className="font-display font-semibold text-[var(--color-on-surface)] mb-4">Login Frequency</h3>
        <div className="space-y-3">
          {loginStats.map((stat) => {
            const user = userMap[stat.userId];
            if (!user) return null;
            return (
              <div key={stat.userId} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors">
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-on-surface)]">{user.name}</p>
                  <p className="text-xs text-[var(--color-on-surface-variant)] capitalize">{user.role}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-[var(--color-on-surface)]">{stat._count.id}</p>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">logins</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
