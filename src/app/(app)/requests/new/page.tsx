import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/lib/permissions";
import { ReimbursementForm } from "@/components/forms/ReimbursementForm";

export default async function NewRequestPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isExec = hasMinRole(session.user.role, "executive");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  const departments = isExec
    ? await prisma.department.findMany({ orderBy: { name: "asc" } })
    : user?.departmentId
    ? await prisma.department.findMany({ where: { id: user.departmentId } })
    : [];

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
          Submit Reimbursement
        </h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
          Fill out the form below to request reimbursement.
        </p>
      </div>
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6">
        <ReimbursementForm
          departments={departments}
          defaultDepartmentId={user?.departmentId ?? undefined}
        />
      </div>
    </div>
  );
}
