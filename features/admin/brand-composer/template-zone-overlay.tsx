'use client'

import { type PointerEvent, type RefObject, useRef } from 'react'
import { type LogoZone, moveLogoZone } from './composer-template'

type Props = {
  zone: LogoZone
  onChange: (value: LogoZone) => void
  canvasRef: RefObject<HTMLCanvasElement | null>
}

export function TemplateZoneOverlay({ zone, onChange, canvasRef }: Props) {
  const drag = useRef<{ x: number; y: number; zone: LogoZone; resize: boolean } | null>(null)

  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.preventDefault()
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      zone,
      resize: (event.target as HTMLElement).closest('[data-resize]') !== null,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    onChange(
      moveLogoZone(
        drag.current.zone,
        (event.clientX - drag.current.x) / rect.width,
        (event.clientY - drag.current.y) / rect.height,
        drag.current.resize,
      ),
    )
  }

  function end() {
    drag.current = null
  }

  return (
    <div
      aria-hidden="true"
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      className="absolute z-10 cursor-move rounded-lg border-2 border-dashed border-[#04e9e7] bg-[#03f8f6]/7 shadow-[0_0_0_9999px_rgba(0,0,0,0.02)]"
      style={{
        left: `${zone.x * 100}%`,
        top: `${zone.y * 100}%`,
        width: `${zone.width * 100}%`,
        height: `${zone.height * 100}%`,
        touchAction: 'none',
      }}
    >
      <span className="pointer-events-none absolute -top-6 left-0 rounded-t bg-[#04e9e7] px-2 py-1 text-[9px] font-black tracking-widest text-[#002324] uppercase">
        Zona de logos
      </span>
      <span
        data-resize="true"
        aria-hidden="true"
        className="absolute -right-2 -bottom-2 grid size-6 cursor-nwse-resize place-items-center rounded border border-white bg-[#04e9e7] text-sm font-black text-[#002324]"
      >
        ↘
      </span>
    </div>
  )
}
