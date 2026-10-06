'use client'

import { Gift, X } from 'lucide-react'
import { callAdmin } from '../api'
import type { DynamicRow } from '../types'
import { type ScanOutcome, ScanStation } from '../ui/scan-station'
import { useReveal } from '../ui/use-reveal'

async function complete(token: string, dynamic: DynamicRow, code: string): Promise<ScanOutcome> {
  const result = await callAdmin('dynamicData', {
    token,
    operation: 'complete',
    id: dynamic.id,
    code,
  })
  const { participant } = result
  if (result.alreadyCompleted)
    return {
      tone: 'neutral',
      headline: result.won ? 'Ya había ganado' : 'Ya participó en esta dinámica',
      participant,
    }
  if (dynamic.type === 'instant_win')
    return result.won
      ? {
          tone: 'success',
          icon: Gift,
          headline: `¡Ganó! ${result.prize || dynamic.prize || 'Premio'}`,
          participant,
        }
      : { tone: 'neutral', headline: 'Esta vez no hubo premio', participant }
  return {
    tone: 'success',
    headline: dynamic.points
      ? `Participación registrada · +${dynamic.points} pts`
      : 'Participación registrada',
    participant,
  }
}

export function ParticipationPanel({
  token,
  dynamic,
  onClose,
}: {
  token: string
  dynamic: DynamicRow
  onClose: () => void
}) {
  const ref = useReveal<HTMLElement>()
  return (
    <section
      ref={ref}
      aria-label={`Registrar participación en ${dynamic.name}`}
      className="mt-4 flex scroll-mt-4 flex-col gap-4 border-t border-neo-border pt-4 md:max-w-120"
    >
      <ScanStation
        inputId={`participation-code-${dynamic.id}`}
        onCode={(code) => complete(token, dynamic, code)}
      />
      <button
        type="button"
        onClick={onClose}
        className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-control border border-neo-border bg-neo-surface px-4 text-neo-text hover:border-neo-text"
      >
        <X aria-hidden className="size-4 shrink-0" />
        <span className="text-[13px] font-bold">Cerrar escáner</span>
      </button>
    </section>
  )
}
