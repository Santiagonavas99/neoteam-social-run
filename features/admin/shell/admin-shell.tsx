'use client'

import { ArrowUpRight, Ellipsis, LogOut, X } from 'lucide-react'
import Link from 'next/link'
import { type ReactNode, useRef } from 'react'
import { BrandLink } from '@/components/brand-link'
import { useThemeChoice } from '@/components/use-theme-choice'
import { type AdminSection, type AdminSectionInfo, sectionGroups, sectionInfo } from '../sections'
import { ThemeSwitch } from './theme-switch'

function NavItem({
  item,
  current,
  onSelect,
}: {
  item: AdminSectionInfo
  current: boolean
  onSelect: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      aria-current={current ? 'page' : undefined}
      onClick={onSelect}
      className={`flex min-h-11 w-full items-center gap-3 rounded-control border-0 px-3 text-left ${
        current
          ? 'bg-neo-on-dark-hover text-neo-white shadow-[inset_3px_0_0_var(--neo-accent)]'
          : 'bg-transparent text-neo-on-dark-secondary hover:bg-neo-on-dark-hover hover:text-neo-white'
      }`}
    >
      <Icon aria-hidden className="size-5 shrink-0" />
      <span className="text-sm">{item.label}</span>
    </button>
  )
}

function SheetItem({ item, onSelect }: { item: AdminSectionInfo; onSelect: () => void }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex min-h-12 w-full items-center gap-3 border-0 border-b border-neo-border bg-transparent px-1 text-left text-neo-text"
    >
      <Icon aria-hidden className="size-5 shrink-0 text-neo-text-secondary" />
      <span className="text-[15px] font-bold">{item.label}</span>
    </button>
  )
}

export function AdminShell({
  sections,
  section,
  onNavigate,
  onSignOut,
  children,
}: {
  sections: AdminSectionInfo[]
  section: AdminSection
  onNavigate: (section: AdminSection) => void
  onSignOut: () => void
  children: ReactNode
}) {
  const current = sectionInfo(section)
  const primarySections = sections.filter((item) => item.primary)
  const moreSections = sections.filter((item) => !item.primary)
  const sheet = useRef<HTMLDialogElement>(null)
  const [theme, setTheme] = useThemeChoice()
  const go = (id: AdminSection) => {
    sheet.current?.close()
    onNavigate(id)
  }

  return (
    <div className="min-h-svh bg-neo-bg text-neo-text md:grid md:grid-cols-[236px_minmax(0,1fr)]">
      <header className="flex items-center justify-between gap-4 bg-neo-black px-4 py-3 text-neo-white [--neo-brand-cyan:var(--neo-accent)] md:hidden">
        <BrandLink />
        <span className="text-xs text-neo-on-dark-secondary">Social Run · 18 oct</span>
      </header>

      <aside className="hidden bg-neo-black px-4 py-8 text-neo-white [--neo-brand-cyan:var(--neo-accent)] md:sticky md:top-0 md:flex md:h-svh md:flex-col md:gap-8 md:overflow-y-auto">
        <div className="px-3">
          <BrandLink />
        </div>
        <nav aria-label="Panel del evento" className="flex flex-col gap-6">
          {sectionGroups
            .filter((group) => sections.some((item) => item.group === group.id))
            .map((group) => (
              <div key={group.id} className="flex flex-col gap-1">
                <p className="m-0 px-3 pb-1 text-xs font-bold uppercase tracking-[0.14em] text-neo-on-dark-secondary">
                  {group.label}
                </p>
                {sections
                  .filter((item) => item.group === group.id)
                  .map((item) => (
                    <NavItem
                      key={item.id}
                      item={item}
                      current={item.id === section}
                      onSelect={() => onNavigate(item.id)}
                    />
                  ))}
                {group.id === 'account' && (
                  <div className="px-1 pt-2">
                    <ThemeSwitch tone="onDark" choice={theme} onSelect={setTheme} />
                  </div>
                )}
              </div>
            ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-neo-on-dark-border pt-4">
          <Link
            href="/"
            target="_blank"
            className="flex min-h-11 items-center gap-3 rounded-control px-3 hover:bg-neo-on-dark-hover"
          >
            <ArrowUpRight aria-hidden className="size-5 shrink-0 text-neo-on-dark-secondary" />
            <span className="text-sm text-neo-on-dark-secondary">Ver página</span>
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="flex min-h-11 items-center gap-3 rounded-control border-0 bg-transparent px-3 text-left text-neo-on-dark-secondary hover:bg-neo-on-dark-hover hover:text-neo-white"
          >
            <LogOut aria-hidden className="size-5 shrink-0" />
            <span className="text-sm">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="mx-auto w-full min-w-0 max-w-[1440px] px-4 pt-5 pb-28 md:px-10 md:pt-10 md:pb-16">
        <header className="mb-5 md:mb-8">
          <h1 className="m-0 text-2xl font-extrabold leading-tight tracking-[-0.04em] md:text-[34px]">
            {current.label}
          </h1>
          <p className="m-0 mt-1 text-sm text-neo-text-secondary">{current.description}</p>
        </header>
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
          onClick={() => sheet.current?.showModal()}
          className={`flex min-h-14 flex-col items-center justify-center gap-0.5 border-0 bg-transparent ${
            current.primary
              ? 'text-neo-text-secondary'
              : 'text-neo-accent-text shadow-[inset_0_3px_0_var(--neo-accent)]'
          }`}
        >
          <Ellipsis aria-hidden className="size-5 shrink-0" />
          <span className="text-xs font-bold">{current.primary ? 'Más' : current.label}</span>
        </button>
      </nav>

      {/* Native <dialog> gives Escape, the focus trap and focus return for free. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop tap is a pointer shortcut; Escape is the keyboard path */}
      <dialog
        ref={sheet}
        aria-label="Más secciones"
        onClick={(event) => event.target === event.currentTarget && sheet.current?.close()}
        className="mt-auto mb-0 w-full max-w-none rounded-t-card border-0 bg-neo-surface p-0 text-neo-text backdrop:bg-neo-black/60 md:hidden"
      >
        <div className="flex flex-col px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-neo-text-secondary">
              Más secciones
            </p>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => sheet.current?.close()}
              className="grid size-11 place-items-center border-0 bg-transparent text-neo-text"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          {moreSections.map((item) => (
            <SheetItem key={item.id} item={item} onSelect={() => go(item.id)} />
          ))}
          <div className="border-b border-neo-border py-3">
            <ThemeSwitch tone="surface" choice={theme} onSelect={setTheme} />
          </div>
          <Link
            href="/"
            target="_blank"
            className="flex min-h-12 items-center gap-3 border-b border-neo-border px-1"
          >
            <ArrowUpRight aria-hidden className="size-5 shrink-0 text-neo-text-secondary" />
            <span className="text-[15px] font-bold text-neo-text">Ver página</span>
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="flex min-h-12 w-full items-center gap-3 border-0 bg-transparent px-1 text-left text-neo-danger"
          >
            <LogOut aria-hidden className="size-5 shrink-0" />
            <span className="text-[15px] font-bold">Cerrar sesión</span>
          </button>
        </div>
      </dialog>
    </div>
  )
}
