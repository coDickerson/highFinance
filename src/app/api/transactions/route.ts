import { NextResponse, after } from "next/server";
import { auth } from "@/auth";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { recordSpend, resolvePosition } from "@/lib/ledger";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { vendor, category, amount, date, budgetId, notes } = body;

  const isExecOrAbove = hasMinRole(session.user.role, "executive");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  // Resolve which budget to post to
  let resolvedBudgetId = budgetId;
  if (!resolvedBudgetId) {
    if (!user?.departmentId) {
      return NextResponse.json({ error: "No department assigned" }, { status: 403 });
    }
    const budget = await prisma.budget.findFirst({
      where: { departmentId: user.departmentId, status: "active" },
      orderBy: [{ year: "desc" }, { semester: "desc" }],
    });
    resolvedBudgetId = budget?.id;
  }

  if (!resolvedBudgetId) {
    return NextResponse.json({ error: "No active budget found" }, { status: 400 });
  }

  // Officers may only post to budgets in their assigned departments
  if (!isExecOrAbove) {
    const [budget, userDepts] = await Promise.all([
      prisma.budget.findUnique({ where: { id: resolvedBudgetId } }),
      prisma.userDepartment.findMany({ where: { userId: session.user.id }, select: { departmentId: true } }),
    ]);
    const allowedDeptIds = new Set([
      ...(user?.departmentId ? [user.departmentId] : []),
      ...userDepts.map((ud) => ud.departmentId),
    ]);
    if (!budget || !allowedDeptIds.has(budget.departmentId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const transaction = await prisma.transaction.create({
    data: {
      budgetId: resolvedBudgetId,
      vendor,
      category: category || "",
      amount: parseFloat(amount),
      date: new Date(date),
      notes: notes || null,
      submittedById: session.user.id,
      status: "approved",  // auto-approve; admin reviews receipts manually
    },
  });

  // Push the spend into the spreadsheet's Officer Budget Tracking matrix.
  // Runs after the response is sent (best-effort) so it never delays or fails
  // the officer's submission.
  after(async () => {
    try {
      const budget = await prisma.budget.findUnique({
        where: { id: resolvedBudgetId },
        include: { department: true },
      });
      const position = budget?.department?.name
        ? resolvePosition(budget.department.name)
        : null;
      if (position) {
        await recordSpend(position, parseFloat(amount), vendor || category || undefined);
      } else if (budget?.department?.name) {
        console.warn(`Sheets sync: no position mapping for department "${budget.department.name}"`);
      }
    } catch (e) {
      console.error("Sheets sync (transaction) failed:", e);
    }
  });

  return NextResponse.json(transaction, { status: 201 });
}
