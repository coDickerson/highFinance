import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { TopHeader } from "@/components/layout/TopHeader";
import { DemoBanner } from "@/components/DemoBanner";

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
      <DemoBanner />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
      />
      <Sidebar role={role} />
      <MobileNav role={role} />
      <div className="md:ml-64 min-h-screen flex flex-col">
        <TopHeader />
        <main className="flex-1 pt-16 pb-24 md:pb-0 bg-[var(--color-surface-container-low)]">
          <div className="max-w-[1700px] mx-auto p-4 md:p-6 xl:px-8 2xl:px-10">{children}</div>
        </main>
      </div>
    </>
  );
}
