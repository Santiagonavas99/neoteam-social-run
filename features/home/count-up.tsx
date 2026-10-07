'use client'

import { useEffect, useRef } from 'react'
import { countUpValue } from './numbers'

const DURATION_MS = 1200

// Server-renders the final number; counts up once when scrolled into view, unless motion is reduced.
export function CountUp({ value, prefix = '' }: { value: number; prefix?: string }) {
  const digits = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = digits.current
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const step = (now: number) => {
          node.textContent = String(countUpValue(value, (now - start) / DURATION_MS))
          if (now - start < DURATION_MS) frame = requestAnimationFrame(step)
        }
        node.textContent = '0'
        frame = requestAnimationFrame(step)
      },
      { threshold: 0.4 },
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value])

  return (
    <>
      <span
        aria-hidden
        className="inline-block tabular-nums"
        style={{ minWidth: `${String(prefix + value).length}ch` }}
      >
        {prefix ? <span className="v2-number-prefix">{prefix}</span> : null}
        <span ref={digits}>{value}</span>
      </span>
      <span className="sr-only">
        {prefix}
        {value}
      </span>
    </>
  )
}
