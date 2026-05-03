import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { MembersClient } from "./MembersClient";

export default async function MembersPage() {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "executive")) redirect("/dashboard");

  const isAdmin = hasMinRole(session.user.role, "admin");

  const [members, signupRequests, departments] = await Promise.all([
    prisma.member.findMany({ orderBy: { name: "asc" } }),
    prisma.signupRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { department: { select: { name: true } } },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const serializedMembers = members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    tier: m.tier,
    duesStatus: m.duesStatus as string,
    lastPayment: m.lastPayment ? m.lastPayment.toISOString() : null,
    duesOwed: Number(m.duesOwed),
    duesPaid: Number(m.duesPaid),
    dueDate: m.dueDate ? m.dueDate.toISOString().split("T")[0] : null,
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

  return (
    <MembersClient
      members={serializedMembers}
      isAdmin={isAdmin}
      signupRequests={serializedSignups}
      departments={departments}
    />
  );
}
