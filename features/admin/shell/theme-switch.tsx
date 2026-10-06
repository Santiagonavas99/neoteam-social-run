'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { parseThemeChoice, resolveTheme, THEME_KEY, type ThemeChoice } from '@/lib/theme'

const options = [
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Oscuro', icon: Moon },
  { id: 'system', label: 'Sistema', icon: Monitor },
] as const

function readChoice(): ThemeChoice {
  try {
    return parseThemeChoice(localStorage.getItem(THEME_KEY))
  } catch {
    return 'system'
  }
}

// One owner for the choice, so the sidebar and the phone sheet never disagree.
export function useThemeChoice() {
  const [choice, setChoice] = useState<ThemeChoice>('system')

  useEffect(() => setChoice(readChoice()), [])

  useEffect(() => {
    const root = document.getElementById('admin-theme')
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => root?.setAttribute('data-theme', resolveTheme(choice, media.matches))
    apply()
    if (choice !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [choice])

  function select(next: ThemeChoice) {
    setChoice(next)
    try {
      if (next === 'system') localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, next)
    } catch {}
  }

  return [choice, select] as const
}

export function ThemeSwitch({
  tone,
  choice,
  onSelect,
}: {
  tone: 'onDark' | 'surface'
  choice: ThemeChoice
  onSelect: (choice: ThemeChoice) => void
}) {
  const frame = tone === 'onDark' ? 'border-neo-on-dark-border' : 'border-neo-border bg-neo-bg'
  return (
    <fieldset>
      <legend className="sr-only">Tema</legend>
      <div className={`grid grid-cols-3 gap-1 rounded-control border p-1 ${frame}`}>
        {options.map(({ id, label, icon: Icon }) => {
          const active = choice === id
          const colors = active
            ? tone === 'onDark'
              ? 'bg-neo-on-dark-hover text-neo-white'
              : 'bg-neo-surface text-neo-text shadow-sm'
            : tone === 'onDark'
              ? 'bg-transparent text-neo-on-dark-secondary hover:text-neo-white'
              : 'bg-transparent text-neo-text-secondary hover:text-neo-text'
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(id)}
              className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[6px] border-0 ${colors}`}
            >
              <Icon aria-hidden className="size-4 shrink-0" />
              <span className="text-xs font-bold">{label}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
