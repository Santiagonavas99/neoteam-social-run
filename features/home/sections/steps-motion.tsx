'use client'

import { type ReactNode, useEffect, useRef } from 'react'
import styles from './steps.module.css'

/**
 * Progressive enhancement: the section is fully visible without JavaScript.
 * Reveal individual blocks only when they enter the viewport, so the animation
 * also works when the four steps form a long vertical list on mobile.
 */
export function StepsMotion({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section || !('IntersectionObserver' in window)) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const revealTargets = section.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!revealTargets.length) return

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const target = entry.target as HTMLElement
          target.dataset.revealed = 'true'
          revealObserver.unobserve(target)
        }
      },
      { rootMargin: '0px 0px -24px 0px', threshold: 0.08 },
    )

    const activeObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        section.dataset.inView = entry.isIntersecting ? 'true' : 'false'
      },
      { threshold: 0 },
    )

    section.dataset.motion = 'enabled'
    revealTargets.forEach((target) => {
      revealObserver.observe(target)
    })
    activeObserver.observe(section)

    return () => {
      revealObserver.disconnect()
      activeObserver.disconnect()
    }
  }, [])

  return (
    <section ref={sectionRef} className={styles.section} id="pasos" aria-labelledby="steps-heading">
      {children}
    </section>
  )
}
