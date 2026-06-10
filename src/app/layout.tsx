import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Fiscal Architect — Treasury Portal",
  description: "Role-based treasury management platform",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Treasury",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
