import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { MembersClient } from "./MembersClient";

export default async function MembersPage() {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) redirect("/dashboard");

  const members = await prisma.member.findMany({ orderBy: { name: "asc" } });

  const serialized = members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    tier: m.tier,
    duesStatus: m.duesStatus,
    lastPayment: m.lastPayment,
  }));

  return <MembersClient members={serialized} />;
}
