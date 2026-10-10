'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

const AeroShards = dynamic(() => import('./vendor/AeroShards'), { ssr: false })

type LoginPalette = {
  backgroundColor: string
  shardColor: string
  accentColor: string
}

export function LoginBackground() {
  const backgroundRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [palette, setPalette] = useState<LoginPalette | null>(null)

  useEffect(() => {
    const root = backgroundRef.current
    if (!root) return
    const css = getComputedStyle(root)
    setPalette({
      backgroundColor: css.getPropertyValue('--neo-bg').trim(),
      shardColor: css.getPropertyValue('--neo-accent-dark').trim(),
      accentColor: css.getPropertyValue('--neo-accent-text').trim(),
    })

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setEnabled('gpu' in navigator && !motion.matches)
    update()
    motion.addEventListener('change', update)
    return () => motion.removeEventListener('change', update)
  }, [])

  return (
    <div
      ref={backgroundRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-neo-bg"
    >
      {enabled && palette ? (
        <div className="absolute inset-0 opacity-60">
          <AeroShards
            {...palette}
            placement="full"
            flow="stream"
            material="satin"
            detail="bold"
            speed={0.3}
            density={0.55}
            glow={0.3}
            bloom={0.18}
            grain={0}
            chromaticAberration={0}
            interaction="none"
            holdToGather={false}
            onError={() => setEnabled(false)}
          />
        </div>
      ) : null}
      <div className="absolute inset-0 bg-neo-black/25" />
    </div>
  )
}
