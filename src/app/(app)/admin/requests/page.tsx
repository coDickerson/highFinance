import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { RequestManager } from "@/components/ui/RequestManager";

export default async function AdminRequestsPage() {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) redirect("/dashboard");

  const requests = await prisma.reimbursementRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      submittedBy: { select: { name: true } },
      department: { select: { name: true } },
      receipts: true,
    },
  });

  const serialized = requests.map((r) => ({
    ...r,
    amount: Number(r.amount),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
          Request Manager
        </h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
          Review and act on reimbursement requests
        </p>
      </div>
      <div style={{ minHeight: "600px" }}>
        <RequestManager requests={serialized} isAdmin />
      </div>
    </div>
  );
}
