'use client'

import { useEffect, useState } from 'react'
import {
  LEGACY_THEME_KEY,
  parseThemeChoice,
  resolveTheme,
  THEME_KEY,
  type ThemeChoice,
} from '@/lib/theme'

function readChoice(): ThemeChoice {
  try {
    return parseThemeChoice(
      localStorage.getItem(THEME_KEY) ?? localStorage.getItem(LEGACY_THEME_KEY),
    )
  } catch {
    return 'system'
  }
}

// One owner per page for the choice, so every switch on it agrees.
export function useThemeChoice() {
  // null until storage is read: applying the 'system' default first would flash light over a stored dark.
  const [choice, setChoice] = useState<ThemeChoice | null>(null)

  useEffect(() => setChoice(readChoice()), [])

  useEffect(() => {
    if (!choice) return
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () =>
      document.documentElement.setAttribute('data-theme', resolveTheme(choice, media.matches))
    apply()
    if (choice !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [choice])

  function select(next: ThemeChoice) {
    setChoice(next)
    try {
      localStorage.removeItem(LEGACY_THEME_KEY)
      if (next === 'system') localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, next)
    } catch {}
  }

  return [choice ?? 'system', select] as const
}
