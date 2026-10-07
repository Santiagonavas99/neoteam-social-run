'use client'

import { type CSSProperties, useEffect, useState } from 'react'

const COLORS = [
  'var(--neo-accent)',
  'var(--neo-accent-dark)',
  'var(--neo-accent-hover)',
  'var(--neo-black)',
  'var(--neo-accent-border)',
  'var(--neo-accent-text)',
]
const COUNT = 28
const LIFETIME_MS = 3200

// Offsets come from the index, so every burst looks the same and renders without Math.random.
const ribbons = Array.from({ length: COUNT }, (_, i) => ({
  '--x': `${(i * 37 + 5) % 100}vw`,
  '--delay': `${(i % 7) * 70}ms`,
  '--spin': `${(i % 2 ? 1 : -1) * (360 + (i % 5) * 180)}deg`,
  '--drift': `${((i % 4) - 1.5) * 18}px`,
  width: `${4 + (i % 3) * 2}px`,
  height: `${16 + (i % 4) * 4}px`,
  background: COLORS[i % COLORS.length],
}))

export function Streamers() {
  const [done, setDone] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setDone(true), LIFETIME_MS)
    return () => clearTimeout(timer)
  }, [])
  if (done) return null
  return (
    <div
      aria-hidden
      data-streamers
      className="pointer-events-none fixed inset-0 z-50 hidden overflow-clip motion-safe:block"
    >
      {ribbons.map((style, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the list is static
        <span key={i} className="streamer" style={style as CSSProperties} />
      ))}
    </div>
  )
}
