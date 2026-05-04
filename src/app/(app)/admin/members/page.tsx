import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { MembersClient } from "./MembersClient";

export default async function MembersPage() {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "executive")) redirect("/dashboard");

  const isAdmin = hasMinRole(session.user.role, "admin");

  const members = await prisma.member.findMany({ orderBy: { name: "asc" } });

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

  return (
    <MembersClient
      members={serializedMembers}
      isAdmin={isAdmin}
    />
  );
}
