'use client'

import { useEffect, useState } from 'react'
import { countdown } from '@/lib/countdown'

const units = [
  ['days', 'Días'],
  ['hours', 'Horas'],
  ['minutes', 'Min'],
  ['seconds', 'Seg'],
] as const

function plural(value: number, one: string, many: string) {
  return `${value} ${value === 1 ? one : many}`
}

export function EventCountdown({
  startsAt,
  endsAt,
  initialNow,
}: {
  startsAt: string
  endsAt: string
  initialNow: number
}) {
  const [now, setNow] = useState(initialNow)

  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const time = countdown(now, Date.parse(startsAt), Date.parse(endsAt))
  if (time.state === 'ended') return null

  if (time.state === 'live') {
    return (
      <div className="mb-7 flex items-center gap-3 text-xs font-bold tracking-[0.14em] text-neo-white">
        <span aria-hidden className="relative flex size-2.5">
          <span className="absolute inset-0 rounded-full bg-neo-accent motion-safe:animate-ping" />
          <span className="relative size-2.5 rounded-full bg-neo-accent" />
        </span>
        EN CURSO · NOS VEMOS EN EL PARQUE DEL INGENIO
      </div>
    )
  }

  const summary =
    time.days > 0
      ? `${plural(time.days, 'día', 'días')} y ${plural(time.hours, 'hora', 'horas')}`
      : `${plural(time.hours, 'hora', 'horas')} y ${plural(time.minutes, 'minuto', 'minutos')}`

  return (
    <div className="mb-7">
      <p className="mb-3 text-xs font-bold tracking-[0.14em] text-neo-accent" aria-hidden>
        FALTAN
      </p>
      <p className="sr-only">Faltan {summary} para el encuentro.</p>
      <div aria-hidden className="flex gap-5 md:gap-7">
        {units.map(([key, label]) => (
          <div key={key} className="grid gap-1.5">
            <span
              suppressHydrationWarning
              className={`text-[34px] leading-none font-extrabold tracking-[-0.04em] tabular-nums md:text-5xl ${
                key === 'seconds' ? 'text-neo-accent' : 'text-neo-white'
              }`}
            >
              {String(time[key]).padStart(2, '0')}
            </span>
            <span className="text-xs tracking-[0.12em] text-neo-white/60 uppercase">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
