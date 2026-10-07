'use client'

import { Moon, Sun } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useThemeChoice } from './use-theme-choice'

// Thumb and icons follow data-theme through the `dark:` variant, so the first paint is already
// right (the head script sets it); the state only feeds aria-checked.
export function ThemeToggle() {
  const [, select, resolved] = useThemeChoice()

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark'
    // React state changes inside the swap, after the browser captured the old screen.
    const swap = () => {
      root.setAttribute('data-theme', next)
      select(next)
    }
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      swap()
      return
    }
    // The new theme grows as a circle from the switch until it covers the farthest corner.
    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const timing = { duration: 450, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
    // The hero is black in both themes, so a cyan ring on the circle's edge keeps the change
    // visible there. Added inside the swap, it is part of the new snapshot, under the circle.
    const ring = document.createElement('div')
    ring.setAttribute('aria-hidden', 'true')
    ring.className = 'theme-ring'
    Object.assign(ring.style, {
      left: `${x - radius}px`,
      top: `${y - radius}px`,
      width: `${radius * 2}px`,
      height: `${radius * 2}px`,
    })
    const transition = document.startViewTransition(() => {
      swap()
      document.body.append(ring)
    })
    transition.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { ...timing, pseudoElement: '::view-transition-new(root)' },
      )
      ring.animate(
        [
          { transform: 'scale(0)', opacity: 1 },
          { opacity: 1, offset: 0.65 },
          { transform: 'scale(1)', opacity: 0 },
        ],
        timing,
      )
    })
    transition.finished.finally(() => ring.remove())
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
