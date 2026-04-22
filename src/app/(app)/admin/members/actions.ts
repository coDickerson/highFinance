"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { DuesStatus } from "@/generated/prisma/client";

export async function createMember(formData: FormData) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) {
    throw new Error("Unauthorized");
  }

  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).trim().toLowerCase();
  const phone = ((formData.get("phone") as string) || "").trim() || null;
  const tier = ((formData.get("tier") as string) || "").trim();
  const duesStatus = (formData.get("duesStatus") as DuesStatus) ?? DuesStatus.overdue;

  if (!name || !email) throw new Error("Name and email are required");

  const existing = await prisma.member.findUnique({ where: { email } });
  if (existing) throw new Error("A member with that email already exists");

  await prisma.member.create({
    data: { name, email, phone, tier, duesStatus },
  });

  revalidatePath("/admin/members");
}

export async function updateDuesStatus(id: string, duesStatus: DuesStatus) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) {
    throw new Error("Unauthorized");
  }

  await prisma.member.update({
    where: { id },
    data: {
      duesStatus,
      lastPayment: duesStatus === "paid" ? new Date() : undefined,
    },
  });

  revalidatePath("/admin/members");
}
