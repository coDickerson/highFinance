"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { Semester } from "@/generated/prisma/client";

export async function getOrCreateFeeBudget(semester: Semester, year: number) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) throw new Error("Unauthorized");

  const existing = await prisma.feeBudget.findFirst({ where: { semester, year } });
  if (existing) return existing;

  return prisma.feeBudget.create({ data: { semester, year } });
}

export async function createFeeCategory(feeBudgetId: string, name: string) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) throw new Error("Unauthorized");

  await prisma.feeCategory.create({ data: { feeBudgetId, name } });
  revalidatePath("/budgets/fees");
}

export async function createFeeItem(formData: FormData) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) throw new Error("Unauthorized");

  const feeCategoryId = formData.get("feeCategoryId") as string;
  const description = (formData.get("description") as string).trim();
  const perMemberRaw = formData.get("perMember") as string;
  const estimatedTotalRaw = formData.get("estimatedTotal") as string;
  const actualTotalRaw = formData.get("actualTotal") as string;
  const dueDate = (formData.get("dueDate") as string) || null;
  const paidDate = (formData.get("paidDate") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!feeCategoryId || !description) throw new Error("Missing required fields");

  const perMember = perMemberRaw ? parseFloat(perMemberRaw) : null;
  const estimatedTotal = parseFloat(estimatedTotalRaw) || 0;
  const actualTotal = actualTotalRaw ? parseFloat(actualTotalRaw) : null;

  await prisma.feeItem.create({
    data: { feeCategoryId, description, perMember, estimatedTotal, actualTotal, dueDate, paidDate, notes },
  });
  revalidatePath("/budgets/fees");
}

export async function updateFeeItem(id: string, formData: FormData) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) throw new Error("Unauthorized");

  const description = (formData.get("description") as string).trim();
  const perMemberRaw = formData.get("perMember") as string;
  const estimatedTotalRaw = formData.get("estimatedTotal") as string;
  const actualTotalRaw = formData.get("actualTotal") as string;
  const dueDate = (formData.get("dueDate") as string) || null;
  const paidDate = (formData.get("paidDate") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  const perMember = perMemberRaw ? parseFloat(perMemberRaw) : null;
  const estimatedTotal = parseFloat(estimatedTotalRaw) || 0;
  const actualTotal = actualTotalRaw ? parseFloat(actualTotalRaw) : null;

  await prisma.feeItem.update({
    where: { id },
    data: { description, perMember, estimatedTotal, actualTotal, dueDate, paidDate, notes },
  });
  revalidatePath("/budgets/fees");
}

export async function deleteFeeItem(id: string) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) throw new Error("Unauthorized");

  await prisma.feeItem.delete({ where: { id } });
  revalidatePath("/budgets/fees");
}

export async function deleteFeeCategory(id: string) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) throw new Error("Unauthorized");

  await prisma.feeCategory.delete({ where: { id } });
  revalidatePath("/budgets/fees");
}
