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
