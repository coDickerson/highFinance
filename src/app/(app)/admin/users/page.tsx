import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) redirect("/dashboard");

  const [users, departments, signupRequests] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: { department: { select: { name: true, colorHex: true } } },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.signupRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { department: { select: { name: true } } },
    }),
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

  const serializedSignups = signupRequests.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    departmentId: r.departmentId,
    role: r.role as string,
    status: r.status as string,
    createdAt: r.createdAt.toISOString(),
    department: r.department ? { name: r.department.name } : null,
  }));

  return <UsersClient users={serializedUsers} departments={serializedDepts} signupRequests={serializedSignups} />;
}
