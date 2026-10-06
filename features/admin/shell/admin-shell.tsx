import { ArrowUpRight, LogOut } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { BrandLink } from '@/components/brand-link'
import { type AdminSection, adminSections, sectionInfo } from '../sections'

export function AdminShell({
  section,
  onNavigate,
  onSignOut,
  children,
}: {
  section: AdminSection
  onNavigate: (section: AdminSection) => void
  onSignOut: () => void
  children: ReactNode
}) {
  const current = sectionInfo(section)
  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <BrandLink />
        <span className="sidebar-caption">SOCIAL RUN / 2026</span>
        <nav aria-label="Panel del evento">
          {adminSections.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              aria-current={section === id ? 'page' : undefined}
              onClick={() => onNavigate(id)}
            >
              <Icon aria-hidden className="size-5 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="sidebar-signout flex items-center gap-2"
          onClick={onSignOut}
        >
          <LogOut aria-hidden className="size-4 shrink-0" />
          Cerrar sesión
        </button>
      </aside>
      <div className="admin-content">
        <div className="admin-topbar">
          <span>NEOTEAM / PANEL DEL EVENTO</span>
          <Link href="/" target="_blank" className="text-link">
            Ver página
            <ArrowUpRight aria-hidden className="size-4 shrink-0" />
          </Link>
        </div>
        <header className="admin-section-header">
          <div>
            <p className="section-label">SOCIAL RUN · 18 OCT</p>
            <h1>{current.label}</h1>
            <p className="muted">{current.description}</p>
          </div>
        </header>
        {children}
      </div>
    </main>
  )
}
