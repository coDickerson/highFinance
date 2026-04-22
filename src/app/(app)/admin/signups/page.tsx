import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { SignupManager } from "@/components/ui/SignupManager";

export default async function AdminSignupsPage() {
  const session = await auth();
  if (!session || !hasMinRole(session.user.role, "admin")) redirect("/dashboard");

  const [requests, departments] = await Promise.all([
    prisma.signupRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        department: { select: { name: true } },
      },
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const serialized = requests.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
          Membership Requests
        </h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm mt-0.5">
          Review, edit, and approve new member sign-up requests
        </p>
      </div>
      <div style={{ minHeight: "600px" }}>
        <SignupManager requests={serialized} departments={departments} />
      </div>
    </div>
  );
}
