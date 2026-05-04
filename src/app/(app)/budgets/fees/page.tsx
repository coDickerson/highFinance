import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { getCurrentSemester } from "@/lib/semester";
import { FeesClient } from "./FeesClient";
import { Semester } from "@/generated/prisma/client";

const FIXED_CATEGORIES = ["National", "Local"] as const;

export default async function FeesPage() {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) redirect("/dashboard");

  const semLabel = getCurrentSemester();
  const [semName, semYearStr] = semLabel.split(" ");
  const semester: Semester = semName.toLowerCase() === "fall" ? "fall" : "spring";
  const year = parseInt(semYearStr);

  // Get or create fee budget
  let budget = await prisma.feeBudget.findFirst({ where: { semester, year } });
  if (!budget) {
    budget = await prisma.feeBudget.create({ data: { semester, year } });
  }

  // Ensure National and Local categories always exist
  const existingCats = await prisma.feeCategory.findMany({
    where: { feeBudgetId: budget.id },
    select: { name: true },
  });
  const existingNames = new Set(existingCats.map((c) => c.name));
  const toCreate = FIXED_CATEGORIES.filter((n) => !existingNames.has(n));
  if (toCreate.length > 0) {
    await prisma.feeCategory.createMany({
      data: toCreate.map((name, i) => ({
        feeBudgetId: budget.id,
        name,
        sortOrder: existingCats.length + i,
      })),
    });
  }

  const [feeBudget, memberCount] = await Promise.all([
    prisma.feeBudget.findFirst({
      where: { id: budget.id },
      include: {
        categories: {
          orderBy: { sortOrder: "asc" },
          include: { items: { orderBy: { sortOrder: "asc" } } },
        },
      },
    }),
    prisma.member.count(),
  ]);

  const serialized = {
    id: feeBudget!.id,
    semester: feeBudget!.semester as string,
    year: feeBudget!.year,
    categories: feeBudget!.categories.map((c) => ({
      id: c.id,
      name: c.name,
      items: c.items.map((i) => ({
        id: i.id,
        description: i.description,
        perMember: i.perMember != null ? Number(i.perMember) : null,
        estimatedTotal: Number(i.estimatedTotal),
        actualTotal: i.actualTotal != null ? Number(i.actualTotal) : null,
        dueDate: i.dueDate,
        paidDate: i.paidDate ?? null,
        notes: i.notes,
      })),
    })),
  };

  return (
    <FeesClient feeBudget={serialized} feeBudgetId={budget.id} memberCount={memberCount} />
  );
}
