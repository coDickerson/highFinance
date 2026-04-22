import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { TransactionForm } from "@/components/forms/TransactionForm";

export default async function NewTransactionPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isExecOrAbove = hasMinRole(session.user.role, "executive");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  if (!isExecOrAbove && !user?.departmentId) redirect("/transactions");

  if (isExecOrAbove) {
    // Execs/admins see a budget selector — fetch all active budgets
    const budgetRows = await prisma.budget.findMany({
      where: { status: "active" },
      include: { department: { select: { name: true, colorHex: true } } },
      orderBy: { department: { name: "asc" } },
    });

    const budgets = budgetRows.map((b) => ({
      id: b.id,
      name: b.name,
      department: { name: b.department.name, colorHex: b.department.colorHex },
    }));

    return (
      <div className="max-w-xl">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Log Transaction
          </h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
            Record an expense against a department budget.
          </p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
          <TransactionForm budgets={budgets} />
        </div>
      </div>
    );
  }

  // Officers — auto-resolve their department's active budget
  const budget = await prisma.budget.findFirst({
    where: { departmentId: user!.departmentId!, status: "active" },
    orderBy: [{ year: "desc" }, { semester: "desc" }],
    include: { department: { select: { name: true, colorHex: true } } },
  });

  if (!budget) redirect("/transactions");

  const budgetProp = {
    id: budget.id,
    name: budget.name,
    department: { name: budget.department.name, colorHex: budget.department.colorHex },
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
          Log Transaction
        </h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
          Record an expense against your department budget.
        </p>
      </div>
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
        <TransactionForm budget={budgetProp} />
      </div>
    </div>
  );
}
