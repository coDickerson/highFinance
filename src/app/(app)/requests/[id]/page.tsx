import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const { id } = await params;

  const req = await prisma.reimbursementRequest.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { name: true } },
      department: { select: { name: true } },
      reviewedBy: { select: { name: true } },
      receipts: true,
    },
  });

  if (!req) notFound();

  // Officers can only see their own requests
  if (session.user.role === "officer" && req.submittedById !== session.user.id) {
    redirect("/requests");
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/requests" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h2 className="font-display text-xl font-extrabold text-[var(--color-on-surface)]">Reimbursement Request</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm">{req.department.name}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={req.status} />
        </div>
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1">
              {req.category}{req.project && ` · ${req.project}`}
            </p>
            <p className="font-display text-xl font-bold text-[var(--color-on-surface)]">{req.description}</p>
          </div>
          <p className="font-display text-2xl font-extrabold text-[var(--color-on-surface)]">
            {fmt(Number(req.amount))}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Submitted by", value: req.submittedBy.name },
            { label: "Department", value: req.department.name },
            { label: "Date", value: new Date(req.createdAt).toLocaleDateString() },
            { label: "Reviewed by", value: req.reviewedBy?.name ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[var(--color-surface-container-low)] rounded-xl p-3">
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">{label}</p>
              <p className="text-sm font-medium text-[var(--color-on-surface)]">{value}</p>
            </div>
          ))}
        </div>

        {req.internalNote && (
          <div className="bg-[var(--color-surface-container)] rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1">Review Note</p>
            <p className="text-sm text-[var(--color-on-surface)]">{req.internalNote}</p>
          </div>
        )}

        {req.receipts.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-2">Attachments</p>
            <div className="flex gap-2 flex-wrap">
              {req.receipts.map((r) => (
                <div key={r.id} className="w-24 h-20 rounded-xl overflow-hidden bg-[var(--color-surface-container)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.url} alt={r.filename} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
