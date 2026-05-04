"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function resetOwnPassword(currentPassword: string, newPassword: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("User not found");

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error("Current password is incorrect");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } });

  // Log the action for admin visibility
  await prisma.activityLog.create({
    data: { userId: session.user.id, action: `${user.name} reset their password` },
  });

  revalidatePath("/settings");
}

export async function deleteOwnAccount() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("User not found");
  if (user.role === "admin") throw new Error("Admin accounts cannot be deleted. Reassign to new treasurer first.");

  await prisma.user.delete({ where: { id: session.user.id } });
  redirect("/login");
}
