import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { status, name, email, departmentId, role } = body;

  if (status !== "approved" && status !== "denied") {
    return NextResponse.json({ error: "Status must be approved or denied." }, { status: 400 });
  }

  const signupRequest = await prisma.signupRequest.findUnique({ where: { id } });
  if (!signupRequest) {
    return NextResponse.json({ error: "Signup request not found." }, { status: 404 });
  }
  if (signupRequest.status !== "pending") {
    return NextResponse.json({ error: "Request has already been reviewed." }, { status: 409 });
  }

  const finalName = name ?? signupRequest.name;
  const finalEmail = email ?? signupRequest.email;
  const finalDepartmentId = departmentId !== undefined ? departmentId : signupRequest.departmentId;
  const finalRole = role ?? signupRequest.role;

  if (status === "approved") {
    const existing = await prisma.user.findUnique({ where: { email: finalEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.signupRequest.update({
        where: { id },
        data: { status: "approved", name: finalName, email: finalEmail, departmentId: finalDepartmentId, role: finalRole },
      }),
      prisma.user.create({
        data: {
          name: finalName,
          email: finalEmail,
          passwordHash: signupRequest.passwordHash,
          role: finalRole,
          departmentId: finalDepartmentId || null,
        },
      }),
    ]);
  } else {
    await prisma.signupRequest.update({
      where: { id },
      data: { status: "denied", name: finalName, email: finalEmail, departmentId: finalDepartmentId, role: finalRole },
    });
  }

  return NextResponse.json({ success: true });
}
