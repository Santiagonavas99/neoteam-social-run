import type { Metadata } from 'next'
import { Host_Grotesk } from 'next/font/google'
import './tailwind.css'
import './globals.css'
import './home-v2.css'
import { themeScript } from '@/lib/theme'

const hostGrotesk = Host_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-host-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Social Run · NeoTeam',
  description: 'Social Run del aniversario de NeoTeam · 18 de octubre de 2026.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={hostGrotesk.variable}
      data-scroll-behavior="smooth"
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static script built from a constant, no user input */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
