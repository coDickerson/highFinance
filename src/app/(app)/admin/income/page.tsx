import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { IncomeClient } from "./IncomeClient";
import { getCurrentSemester } from "@/lib/semester";

export default async function IncomePage() {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) redirect("/dashboard");

  const [rows, paidMembers, totalMembers] = await Promise.all([
    prisma.income.findMany({ orderBy: { date: "desc" } }),
    prisma.member.count({ where: { duesStatus: "paid" } }),
    prisma.member.count(),
  ]);

  const serialized = rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    description: r.description,
    date: r.date,
    semester: r.semester,
    year: r.year,
  }));

  const semLabel = getCurrentSemester(); // e.g. "Spring 2026"
  const [semName, semYearStr] = semLabel.split(" ");
  const currentSemester = semName.toLowerCase() === "fall" ? "fall" : "spring";
  const currentYear = parseInt(semYearStr);

  return (
    <IncomeClient
      rows={serialized}
      currentSemester={currentSemester}
      currentYear={currentYear}
      paidMembers={paidMembers}
      totalMembers={totalMembers}
    />
  );
}
