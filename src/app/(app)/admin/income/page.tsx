import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { IncomeClient } from "./IncomeClient";

export default async function IncomePage() {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) redirect("/dashboard");

  const rows = await prisma.income.findMany({ orderBy: { date: "desc" } });

  const serialized = rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    description: r.description,
    date: r.date,
    semester: r.semester,
    year: r.year,
  }));

  // Current semester = Fall 2026
  return (
    <IncomeClient
      rows={serialized}
      currentSemester="fall"
      currentYear={2026}
    />
  );
}
