import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";

// Material Symbols font loaded via link tag in layout
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role;

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
      />
      <Sidebar role={role} />
      <div className="ml-64 min-h-screen flex flex-col">
        <TopHeader />
        <main className="flex-1 pt-16 bg-[var(--color-surface-container-low)]">
          <div className="max-w-7xl mx-auto p-6">{children}</div>
        </main>
      </div>
    </>
  );
}
