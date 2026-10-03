import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Run · NeoTeam",
  description: "Social Run del aniversario de NeoTeam · 18 de octubre de 2026.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
