'use client'

import { Moon, Sun } from 'lucide-react'
import { useThemeChoice } from './use-theme-choice'

// Thumb and icons follow data-theme through the `dark:` variant, so the first paint is already
// right (the head script sets it); the state only feeds aria-checked.
export function ThemeToggle() {
  const [, select, resolved] = useThemeChoice()

  function toggle() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    select(next)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={resolved === 'dark'}
      aria-label="Modo oscuro"
      onClick={toggle}
      className="group grid min-h-11 shrink-0 place-items-center rounded-full border-0 bg-transparent px-0.5"
    >
      <span className="relative flex h-8 w-14 items-center justify-between rounded-full border border-neo-on-dark-border px-1.5 text-neo-on-dark-secondary transition-colors group-hover:border-neo-on-dark-secondary group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-neo-accent">
        <Sun aria-hidden className="size-3.5" />
        <Moon aria-hidden className="size-3.5" />
        <span
          aria-hidden
          className="absolute top-0.5 left-0.5 grid size-6 place-items-center rounded-full bg-neo-white text-neo-black transition-transform duration-200 ease-out motion-reduce:transition-none dark:translate-x-7"
        >
          <Sun className="size-3.5 dark:hidden" />
          <Moon className="hidden size-3.5 dark:block" />
        </span>
      </span>
    </button>
  )
}
