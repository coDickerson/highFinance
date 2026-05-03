import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "admin";
  const formData = await req.formData();

  const departmentId = formData.get("departmentId") as string | null;
  const amount = formData.get("amount") as string | null;
  const paymentMethod = formData.get("paymentMethod") as string | null;
  const venmoZelle = formData.get("venmoZelle") as string | null;
  const description = formData.get("description") as string | null;
  const receipt = formData.get("receipt") as File | null;

  if (!departmentId || !amount || !paymentMethod || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const needsVenmoZelle = paymentMethod === "venmo" || paymentMethod === "zelle";
  if (needsVenmoZelle && !venmoZelle) {
    return NextResponse.json({ error: "Venmo/Zelle address is required for this payment method" }, { status: 400 });
  }

  // Receipt is required for non-admin users only
  if (!isAdmin && (!receipt || receipt.size === 0)) {
    return NextResponse.json({ error: "Receipt image is required" }, { status: 400 });
  }

  const request = await prisma.reimbursementRequest.create({
    data: {
      submittedById: session.user.id,
      departmentId,
      amount: parseFloat(amount),
      category: paymentMethod,
      paymentMethod,
      venmoZelle: venmoZelle || null,
      description,
      // Admin submissions are auto-approved
      ...(isAdmin
        ? { status: "approved", reviewedById: session.user.id }
        : { status: "pending" }),
    },
  });

  // Save receipt if provided
  if (receipt && receipt.size > 0) {
    const ext = receipt.name.split(".").pop() ?? "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads");
    const bytes = await receipt.arrayBuffer();
    await writeFile(join(uploadDir, filename), Buffer.from(bytes));

    await prisma.receipt.create({
      data: {
        requestId: request.id,
        filename: receipt.name,
        url: `/uploads/${filename}`,
        mimeType: receipt.type || "image/jpeg",
      },
    });
  }

  return NextResponse.json(request, { status: 201 });
}
