'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const AeroShards = dynamic(() => import('./vendor/AeroShards'), { ssr: false })

export function LoginBackground() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setEnabled('gpu' in navigator && !motion.matches)
    update()
    motion.addEventListener('change', update)
    return () => motion.removeEventListener('change', update)
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-neo-bg">
      {enabled ? (
        <div className="absolute inset-0 opacity-60">
          <AeroShards
            backgroundColor="#080f0e"
            shardColor="#077271"
            accentColor="#24fdfa"
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
