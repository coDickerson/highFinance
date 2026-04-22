import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role;
  if (role === "admin") redirect("/admin/dashboard");
  if (role === "executive") redirect("/executive/dashboard");
  redirect("/officer/dashboard");
}
