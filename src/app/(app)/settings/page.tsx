import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SettingsClient
      name={session.user.name ?? ""}
      email={session.user.email ?? ""}
      role={session.user.role ?? "officer"}
      isAdmin={hasMinRole(session.user.role, "admin")}
    />
  );
}
