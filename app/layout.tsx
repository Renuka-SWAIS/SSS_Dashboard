import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SWAIS Login",
  description: "Google authentication and role-based onboarding for SWAIS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
