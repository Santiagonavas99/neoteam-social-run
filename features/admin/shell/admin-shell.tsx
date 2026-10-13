'use client'

import { ArrowUpRight, Ellipsis, LogOut, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { type ReactNode, useRef } from 'react'
import { BrandLink } from '@/components/brand-link'
import { useThemeChoice } from '@/components/use-theme-choice'
import { OnlineAdmins } from '../overview/online-admins'
import { type AdminSection, type AdminSectionInfo, sectionGroups, sectionInfo } from '../sections'
import { ThemeSwitch } from './theme-switch'

function PrimaryNavItem({
  item,
  active,
  onSelect,
}: {
  item: AdminSectionInfo
  active: boolean
  onSelect: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={onSelect}
      className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-control border px-3 text-sm font-bold transition-colors ${
        active
          ? 'border-neo-border-strong bg-neo-muted-bg text-neo-text'
          : 'border-transparent bg-transparent text-neo-text-secondary hover:bg-neo-muted-bg hover:text-neo-text'
      }`}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      {item.label}
    </button>
  )
}

function SheetItem({
  item,
  active,
  onSelect,
}: {
  item: AdminSectionInfo
  active: boolean
  onSelect: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={onSelect}
      className={`flex min-h-11 w-full items-center gap-3 rounded-control border-0 px-3 text-left text-sm ${
        active
          ? 'bg-neo-muted-bg font-bold text-neo-text'
          : 'bg-transparent text-neo-text-secondary hover:bg-neo-muted-bg hover:text-neo-text'
      }`}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      <span>{item.label}</span>
    </button>
  )
}

export function AdminShell({
  sections,
  section,
  onNavigate,
  onSignOut,
  showPresence = false,
  children,
}: {
  sections: AdminSectionInfo[]
  section: AdminSection
  onNavigate: (section: AdminSection) => void
  onSignOut: () => void
  showPresence?: boolean
  children: ReactNode
}) {
  const current = sectionInfo(section)
  const primarySections = sections.filter((item) => item.primary)
  const moreSections = sections.filter((item) => !item.primary)
  const menu = useRef<HTMLDialogElement>(null)
  const [theme, setTheme] = useThemeChoice()

  const go = (id: AdminSection) => {
    menu.current?.close()
    onNavigate(id)
  }

  return (
    <div className="min-h-svh bg-neo-bg text-neo-text">
      <header className="sticky top-0 z-30 border-b border-neo-border bg-neo-surface">
        <div className="mx-auto flex min-h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-4 md:px-8">
          <div className="shrink-0 [--neo-brand-cyan:var(--neo-accent)]">
            <BrandLink />
          </div>
          <nav aria-label="Accesos rápidos del panel" className="hidden min-w-0 items-center gap-1 md:flex">
            {primarySections.map((item) => (
              <PrimaryNavItem
                key={item.id}
                item={item}
                active={item.id === section}
                onSelect={() => go(item.id)}
              />
            ))}
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => menu.current?.showModal()}
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-control border border-neo-border px-3 text-sm font-bold text-neo-text-secondary hover:bg-neo-muted-bg hover:text-neo-text"
            >
              <Menu aria-hidden className="size-4" />
              Todas las secciones
            </button>
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs text-neo-text-secondary lg:block">
              Social Run · 18 oct
            </span>
            <button
              type="button"
              aria-label="Abrir menú del panel"
              aria-haspopup="dialog"
              onClick={() => menu.current?.showModal()}
              className="grid size-11 place-items-center rounded-control border border-neo-border bg-transparent text-neo-text md:hidden"
            >
              <Menu aria-hidden className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-[1500px] px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-16">
        {section === 'dynamics' ? (
          showPresence ? (
            <div className="mb-3 flex min-h-7 justify-end">
              <OnlineAdmins />
            </div>
          ) : null
        ) : (
          <header className="mb-5 flex items-start justify-between gap-3 md:mb-8">
            <div className="min-w-0 flex-1">
              <h1 className="m-0 text-2xl font-extrabold leading-tight tracking-[-0.04em] md:text-[34px]">
                {current.label}
              </h1>
              <p className="m-0 mt-1 text-sm text-neo-text-secondary">{current.description}</p>
            </div>
            {showPresence && <OnlineAdmins />}
          </header>
        )}
        {children}
      </main>

      <nav
        aria-label="Secciones principales"
        className="fixed inset-x-0 bottom-0 z-30 grid auto-cols-fr grid-flow-col border-t border-neo-border bg-neo-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {primarySections.map((item) => {
          const Icon = item.icon
          const active = item.id === section
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => go(item.id)}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 border-0 bg-transparent ${
                active
                  ? 'text-neo-accent-text shadow-[inset_0_3px_0_var(--neo-accent)]'
                  : 'text-neo-text-secondary'
              }`}
            >
              <Icon aria-hidden className="size-5 shrink-0" />
              <span className="text-xs font-bold">{item.label}</span>
            </button>
          )
        })}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-current={current.primary ? undefined : 'page'}
          onClick={() => menu.current?.showModal()}
          className={`flex min-h-14 flex-col items-center justify-center gap-0.5 border-0 bg-transparent ${
            current.primary
              ? 'text-neo-text-secondary'
              : 'text-neo-accent-text shadow-[inset_0_3px_0_var(--neo-accent)]'
          }`}
        >
          <Ellipsis aria-hidden className="size-5 shrink-0" />
          <span className="max-w-20 truncate text-xs font-bold">
            {current.primary ? 'Más' : current.label}
          </span>
        </button>
      </nav>

      {/* The native dialog retains keyboard focus trapping, Escape and focus return. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click supplements Escape */}
      <dialog
        ref={menu}
        aria-label="Navegar por el panel"
        onClick={(event) => event.target === event.currentTarget && menu.current?.close()}
        className="mt-auto mb-0 w-full max-w-none rounded-t-card border border-neo-border bg-neo-surface p-0 text-neo-text backdrop:bg-neo-black/60 md:mx-auto md:my-auto md:w-[min(560px,calc(100%-32px))] md:rounded-card"
      >
        <div className="max-h-[85svh] overflow-y-auto p-5 md:p-6">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h2 className="m-0 text-lg font-black">Navegar por el panel</h2>
              <p className="m-0 mt-1 text-xs text-neo-text-secondary">Todas las herramientas del evento.</p>
            </div>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => menu.current?.close()}
              className="grid size-10 place-items-center border-0 bg-transparent text-neo-text"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          {sectionGroups
            .filter((group) => sections.some((item) => item.group === group.id))
            .map((group) => (
              <div key={group.id} className="mt-4">
                <p className="m-0 mb-2 text-xs font-bold uppercase tracking-widest text-neo-text-secondary">
                  {group.label}
                </p>
                <div className="grid gap-1 sm:grid-cols-2">
                  {sections
                    .filter((item) => item.group === group.id)
                    .map((item) => (
                      <SheetItem
                        key={item.id}
                        item={item}
                        active={item.id === section}
                        onSelect={() => go(item.id)}
                      />
                    ))}
                </div>
              </div>
            ))}
          <div className="mt-5 border-t border-neo-border pt-4">
            <ThemeSwitch tone="surface" choice={theme} onSelect={setTheme} />
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex min-h-11 items-center gap-2 text-sm text-neo-text-secondary"
          >
            <ArrowUpRight aria-hidden className="size-4" /> Ver página
          </Link>
          <button
            type="button"
            onClick={() => {
              menu.current?.close()
              onSignOut()
            }}
            className="flex min-h-11 items-center gap-2 border-0 bg-transparent text-sm font-bold text-neo-danger"
          >
            <LogOut aria-hidden className="size-4" /> Cerrar sesión
          </button>
        </div>
      </dialog>
    </div>
  )
}
