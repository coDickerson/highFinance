import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { TransactionForm } from "@/components/forms/TransactionForm";

export default async function NewTransactionPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isExecOrAbove = hasMinRole(session.user.role, "executive");

  // Fetch all active budgets the user can post to
  let officerBudgets: { id: string; name: string; department: { name: string; colorHex: string } }[] = [];

  if (isExecOrAbove) {
    const rows = await prisma.budget.findMany({
      where: { status: "active" },
      include: { department: { select: { name: true, colorHex: true } } },
      orderBy: { department: { name: "asc" } },
    });
    officerBudgets = rows.map((b) => ({
      id: b.id,
      name: b.name,
      department: { name: b.department.name, colorHex: b.department.colorHex },
    }));
  } else {
    // Officers: collect dept IDs from departmentId + UserDepartment join table
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { userDepartments: true },
    });
    const deptIds = Array.from(
      new Set([
        ...(user?.departmentId ? [user.departmentId] : []),
        ...(user?.userDepartments.map((ud) => ud.departmentId) ?? []),
      ])
    );
    if (deptIds.length === 0) redirect("/transactions");
    const rows = await prisma.budget.findMany({
      where: { departmentId: { in: deptIds }, status: "active" },
      include: { department: { select: { name: true, colorHex: true } } },
      orderBy: [{ year: "desc" }, { semester: "desc" }],
    });
    officerBudgets = rows.map((b) => ({
      id: b.id,
      name: b.name,
      department: { name: b.department.name, colorHex: b.department.colorHex },
    }));
    if (officerBudgets.length === 0) {
      return (
        <div className="max-w-xl">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">Log Transaction</h2>
          </div>
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-8 text-center">
            <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-4xl mb-3 block">account_balance_wallet</span>
            <p className="text-[var(--color-on-surface)] font-medium mb-1">No active budget assigned</p>
            <p className="text-[var(--color-on-surface-variant)] text-sm">Contact your treasurer to set up an active budget before logging transactions.</p>
          </div>
        </div>
      );
    }
  }

  // Single budget for officer with one dept → show as fixed; multiple → show selector
  const showSelector = officerBudgets.length > 1 || isExecOrAbove;

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">Log Transaction</h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
          {isExecOrAbove ? "Record an expense against a department budget." : "Record an expense against your budget."}
        </p>
      </div>
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
        {showSelector
          ? <TransactionForm budgets={officerBudgets} />
          : <TransactionForm budget={officerBudgets[0]} />
        }
      </div>
    </div>
  );
}
