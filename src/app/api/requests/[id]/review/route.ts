import { NextResponse, after } from "next/server";
import { auth } from "@/auth";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { recordSpend, resolvePosition, updateReimbursementStatus } from "@/lib/ledger";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status, internalNote } = await req.json();

  if (status !== "approved" && status !== "denied") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const request = await prisma.reimbursementRequest.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.reimbursementRequest.update({
    where: { id },
    data: { status, internalNote: internalNote || null, reviewedById: session.user.id },
  });

  if (status === "approved") {
    const budget = await prisma.budget.findFirst({
      where: { departmentId: request.departmentId, status: "active" },
      orderBy: [{ year: "desc" }, { semester: "desc" }],
    });

    if (budget) {
      await prisma.transaction.create({
        data: {
          budgetId: budget.id,
          vendor: request.submittedBy.name,
          category: request.category,
          amount: request.amount,
          date: new Date(),
          notes: request.description,
          submittedById: request.submittedById,
          status: "approved",
        },
      });
    }
  }

  await prisma.activityLog.create({
    data: { userId: session.user.id, action: `${status}_request` },
  });

  // Sync the decision to the sheet (best-effort, after the response):
  //  - update the reimbursement's Status cell
  //  - on approval, push the resulting spend into the tracking matrix
  after(async () => {
    try {
      await updateReimbursementStatus(id, status === "approved" ? "Approved" : "Denied");
      if (status === "approved") {
        const position = request.department?.name
          ? resolvePosition(request.department.name)
          : null;
        if (position) {
          await recordSpend(position, Number(request.amount), request.submittedBy.name);
        }
      }
    } catch (e) {
      console.error("Sheets sync (review) failed:", e);
    }
  });

  return NextResponse.json(updated);
}
