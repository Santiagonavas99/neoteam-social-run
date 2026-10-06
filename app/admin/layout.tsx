import { themeScript } from '@/lib/theme'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="admin-theme"
      data-theme="light"
      suppressHydrationWarning
      className="min-h-svh bg-neo-bg text-neo-text"
    >
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static script built from a constant, no user input */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {children}
    </div>
  )
}
