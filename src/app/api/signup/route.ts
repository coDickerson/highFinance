import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { name, email, password, departmentId } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const pendingRequest = await prisma.signupRequest.findFirst({
    where: { email, status: "pending" },
  });
  if (pendingRequest) {
    return NextResponse.json(
      { error: "A pending request for this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const request = await prisma.signupRequest.create({
    data: {
      name,
      email,
      passwordHash,
      departmentId: departmentId || null,
    },
  });

  return NextResponse.json({ id: request.id }, { status: 201 });
}
