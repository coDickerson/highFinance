import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) redirect("/dashboard");

  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: { department: { select: { name: true, colorHex: true } } },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  const serializedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    createdAt: u.createdAt,
  }));

  const serializedDepts = departments.map((d) => ({
    id: d.id,
    name: d.name,
    colorHex: d.colorHex,
  }));

  return <UsersClient users={serializedUsers} departments={serializedDepts} />;
}
