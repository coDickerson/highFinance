import { NextResponse, after } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { appendReimbursement } from "@/lib/ledger";
import { saveReceipt } from "@/lib/storage";

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
  let receiptUrl = "";
  if (receipt && receipt.size > 0) {
    receiptUrl = await saveReceipt(receipt);

    await prisma.receipt.create({
      data: {
        requestId: request.id,
        filename: receipt.name,
        url: receiptUrl,
        mimeType: receipt.type || "image/jpeg",
      },
    });
  }

  // Append the reimbursement to the spreadsheet's Reimbursements tab.
  // Runs after the response is sent (best-effort) so it never delays or fails
  // the submission.
  const submitterId = session.user.id;
  after(async () => {
    try {
      const [dept, submitter] = await Promise.all([
        prisma.department.findUnique({ where: { id: departmentId } }),
        prisma.user.findUnique({ where: { id: submitterId } }),
      ]);
      await appendReimbursement({
        email: submitter?.email ?? "",
        name: submitter?.name ?? "",
        berkeleyEmail: submitter?.email ?? "",
        phone: "",
        venmo: venmoZelle ?? "",
        amount: parseFloat(amount),
        paymentMethod: paymentMethod ?? "",
        budget: dept?.name ?? "",
        purpose: description ?? "",
        receiptUrl,
        status: isAdmin ? "Approved" : "Pending",
        requestId: request.id,
      });
    } catch (e) {
      console.error("Sheets sync (reimbursement) failed:", e);
    }
  });

  return NextResponse.json(request, { status: 201 });
}
