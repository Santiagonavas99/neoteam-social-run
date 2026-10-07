'use client'

import { CircleX } from 'lucide-react'
import { formatTime } from '@/features/event/datetime'
import { callAdmin } from '../api'
import { type ScanOutcome, ScanStation } from '../ui/scan-station'

async function checkIn(code: string): Promise<ScanOutcome> {
  const { result, participant } = await callAdmin('checkin', { code })
  if (!result || !participant) throw new Error('No pudimos registrar el check-in.')
  if (result === 'checkedIn') return { tone: 'success', headline: 'Check-in listo', participant }
  if (result === 'cancelled')
    return { tone: 'danger', icon: CircleX, headline: 'Inscripción cancelada', participant }
  const at = participant.checkedInAt
  return {
    tone: 'neutral',
    headline: at ? `Ya hizo check-in a las ${formatTime(at)}` : 'Ya hizo check-in',
    participant,
  }
}

export function CheckinView() {
  return (
    <section className="mx-auto w-full max-w-120">
      <ScanStation inputId="checkin-code" onCode={(code) => checkIn(code)} />
    </section>
  )
}
