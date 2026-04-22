import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";

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

  // Officers may only post to their own department's budget
  if (!isExecOrAbove) {
    const budget = await prisma.budget.findUnique({ where: { id: resolvedBudgetId } });
    if (!budget || budget.departmentId !== user?.departmentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const transaction = await prisma.transaction.create({
    data: {
      budgetId: resolvedBudgetId,
      vendor,
      category,
      amount: parseFloat(amount),
      date: new Date(date),
      notes: notes || null,
      submittedById: session.user.id,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
