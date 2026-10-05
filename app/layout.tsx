import type { Metadata } from "next";
import { Host_Grotesk } from "next/font/google";
import "./globals.css";
import "./neo-overrides.css";
import "./logo-marquee.css";
import "./home-v2.css";
import "./checkin-wallet.css";

const hostGrotesk = Host_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-host-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Social Run · NeoTeam",
  description: "Social Run del aniversario de NeoTeam · 18 de octubre de 2026.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={hostGrotesk.variable}>
      <body>{children}</body>
    </html>
  );
}
