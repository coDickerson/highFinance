"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { Semester, IncomeType } from "@/generated/prisma/client";

export async function createIncome(formData: FormData) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) {
    throw new Error("Unauthorized");
  }

  const type = formData.get("type") as IncomeType;
  const amount = parseFloat(formData.get("amount") as string);
  const description = (formData.get("description") as string).trim();
  const date = new Date(formData.get("date") as string);
  const semester = formData.get("semester") as Semester;
  const year = parseInt(formData.get("year") as string, 10);

  if (!type || isNaN(amount) || !description || isNaN(date.getTime()) || !semester || isNaN(year)) {
    throw new Error("Invalid form data");
  }

  await prisma.income.create({
    data: { type, amount, description, date, semester, year },
  });

  revalidatePath("/admin/income");
}

export async function deleteIncome(id: string) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) {
    throw new Error("Unauthorized");
  }

  await prisma.income.delete({ where: { id } });
  revalidatePath("/admin/income");
}
