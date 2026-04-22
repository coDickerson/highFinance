import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Fiscal Architect — Treasury Portal",
  description: "Role-based treasury management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-[var(--color-background)] text-[var(--color-on-surface)]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
