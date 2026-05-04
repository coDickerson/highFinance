"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function createBudget(formData: FormData) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) throw new Error("Unauthorized");

  const departmentId = formData.get("departmentId") as string;
  const name = (formData.get("name") as string).trim();
  const totalAmount = parseFloat(formData.get("totalAmount") as string);
  const semester = formData.get("semester") as "fall" | "spring";
  const year = parseInt(formData.get("year") as string);

  if (!departmentId || !name || isNaN(totalAmount) || !semester || isNaN(year)) {
    throw new Error("All fields required");
  }

  await prisma.budget.create({
    data: { departmentId, name, totalAmount, semester, year, status: "active" },
  });

  revalidatePath("/budgets");
}

export async function updateBudget(id: string, formData: FormData) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) throw new Error("Unauthorized");

  const name = (formData.get("name") as string).trim();
  const totalAmount = parseFloat(formData.get("totalAmount") as string);

  if (!name || isNaN(totalAmount)) throw new Error("Name and amount required");

  await prisma.budget.update({ where: { id }, data: { name, totalAmount } });

  revalidatePath("/budgets");
  revalidatePath(`/budgets/${id}`);
}

export async function deleteBudget(id: string) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) throw new Error("Unauthorized");

  await prisma.transaction.deleteMany({ where: { budgetId: id } });
  await prisma.budget.delete({ where: { id } });

  revalidatePath("/budgets");
}

function csvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportHistoricalBudgets(): Promise<string> {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) throw new Error("Unauthorized");

  const departments = await prisma.department.findMany({
    include: {
      budgets: {
        include: { transactions: { orderBy: { date: "asc" } } },
        orderBy: [{ year: "asc" }, { semester: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  const header = [
    "Department", "Budget Name", "Semester", "Year", "Budget Status",
    "Total Budget ($)", "Vendor", "Category", "Amount ($)", "Date", "Transaction Status",
  ].join(",");

  const rows: string[] = [header];

  for (const dept of departments) {
    for (const budget of dept.budgets) {
      const base = [
        csvCell(dept.name),
        csvCell(budget.name),
        budget.semester,
        String(budget.year),
        budget.status,
        Number(budget.totalAmount).toFixed(2),
      ];
      if (budget.transactions.length === 0) {
        rows.push([...base, "", "", "", "", ""].join(","));
      } else {
        for (const tx of budget.transactions) {
          rows.push([
            ...base,
            csvCell(tx.vendor),
            csvCell(tx.category),
            Number(tx.amount).toFixed(2),
            tx.date.toISOString().split("T")[0],
            tx.status,
          ].join(","));
        }
      }
    }
  }

  return rows.join("\n");
}
