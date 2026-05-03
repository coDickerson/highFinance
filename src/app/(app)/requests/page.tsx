import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function RequestsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = hasMinRole(session.user.role, "admin");
  const isExec = hasMinRole(session.user.role, "executive");

  // Get user's department for officer filtering
  const user = isExec
    ? null
    : await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { departmentId: true },
      });

  const where = isExec
    ? {}
    : {
        OR: [
          { submittedById: session.user.id },
          ...(user?.departmentId ? [{ departmentId: user.departmentId }] : []),
        ],
      };

  const requests = await prisma.reimbursementRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      submittedBy: { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            {isExec ? "All Reimbursement Requests" : "My Reimbursement Requests"}
          </h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
            {requests.length} total
            {isAdmin && (
              <> · <Link href="/admin/requests" className="text-[var(--color-primary)] hover:underline">Open Approval Manager →</Link></>
            )}
          </p>
        </div>
        <Link
          href="/requests/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #000000 0%, #111111 100%)" }}
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Reimbursement Request
        </Link>
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
        <div className="space-y-3">
          {requests.length === 0 && (
            <p className="text-[var(--color-on-surface-variant)] text-sm">No requests yet.</p>
          )}
          {requests.map((req) => (
            <Link
              key={req.id}
              href={`/requests/${req.id}`}
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--color-surface-container-low)] transition-colors border-l-4 border-transparent hover:border-[var(--color-primary)] block"
            >
              <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-container)] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-[18px]">request_page</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">{req.description}</p>
                <p className="text-xs text-[var(--color-on-surface-variant)]">
                  {req.department.name} · {req.submittedBy.name} · {new Date(req.createdAt).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={req.status} />
              <p className="font-semibold text-sm tabular-nums text-[var(--color-on-surface)] w-24 text-right">
                {fmt(Number(req.amount))}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
