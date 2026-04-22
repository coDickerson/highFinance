import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";

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

  const updated = await prisma.reimbursementRequest.update({
    where: { id },
    data: { status, internalNote: internalNote || null, reviewedById: session.user.id },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: `${status}_request`,
    },
  });

  return NextResponse.json(updated);
}
