'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useId, useRef } from 'react'
import type { ThemeChoice } from '@/lib/theme'
import { useThemeChoice } from './use-theme-choice'

const options = [
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Oscuro', icon: Moon },
  { id: 'system', label: 'Sistema', icon: Monitor },
] as const

// A native popover gives Escape, light dismiss and focus return without a library.
export function ThemeMenu() {
  const [choice, select] = useThemeChoice()
  const id = useId()
  const button = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLFieldSetElement>(null)
  const current = options.find((option) => option.id === choice) ?? options[2]
  const Icon = current.icon

  function place() {
    const rect = button.current?.getBoundingClientRect()
    if (!rect || !menu.current) return
    menu.current.style.top = `${rect.bottom + 8}px`
    menu.current.style.right = `${window.innerWidth - rect.right}px`
  }

  function pick(next: ThemeChoice) {
    select(next)
    menu.current?.hidePopover()
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        popoverTarget={id}
        aria-label={`Tema: ${current.label}`}
        onClick={place}
        className="grid size-11 shrink-0 place-items-center rounded-control border border-neo-on-dark-border bg-transparent text-neo-white hover:bg-neo-on-dark-hover"
      >
        <Icon aria-hidden className="size-5" />
      </button>
      <fieldset
        ref={menu}
        id={id}
        popover="auto"
        className="fixed inset-auto m-0 w-44 rounded-card border! border-solid border-neo-on-dark-border! bg-neo-black p-1.5! text-neo-white shadow-xl"
      >
        <legend className="sr-only">Tema</legend>
        {options.map((option) => {
          const OptionIcon = option.icon
          const active = option.id === choice
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => pick(option.id)}
              className={`flex min-h-11 w-full items-center gap-3 rounded-control border-0 px-3 text-left ${
                active
                  ? 'bg-neo-on-dark-hover text-neo-white'
                  : 'bg-transparent text-neo-on-dark-secondary hover:text-neo-white'
              }`}
            >
              <OptionIcon aria-hidden className="size-4 shrink-0" />
              <span className="text-sm">{option.label}</span>
            </button>
          )
        })}
      </fieldset>
    </>
  )
}
