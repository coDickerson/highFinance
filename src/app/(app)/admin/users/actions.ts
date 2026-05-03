"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { Role } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

export async function createUser(formData: FormData) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) {
    throw new Error("Unauthorized");
  }

  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;
  const role = formData.get("role") as Role;
  const departmentId = (formData.get("departmentId") as string) || null;

  if (!name || !email || !password || !role) throw new Error("All fields required");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("A user with that email already exists");

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      departmentId: role === "officer" ? departmentId : null,
    },
  });

  revalidatePath("/admin/users");
}

export async function updateUserRole(id: string, role: Role, departmentId: string | null) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id },
    data: { role, departmentId: role === "officer" ? departmentId : null },
  });

  revalidatePath("/admin/users");
}

export async function deleteUser(id: string) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) {
    throw new Error("Unauthorized");
  }

  // Prevent deleting yourself or other admins
  if (id === session.user.id) throw new Error("Cannot delete your own account");
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (target?.role === "admin") throw new Error("Cannot delete admin accounts");

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}

export async function resetPassword(id: string, newPassword: string) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) {
    throw new Error("Unauthorized");
  }

  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  revalidatePath("/admin/users");
}
