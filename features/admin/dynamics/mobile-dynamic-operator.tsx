'use client'

import { ArrowLeft, CheckCircle2, Copy, Gift, Pencil, Play, Trophy, Zap } from 'lucide-react'
import { useState } from 'react'
import { dynamicStates } from '../labels'
import type { CommunityRecord, DynamicRow, LogoItem, ScannedParticipant } from '../types'
import { DrawResult } from './draw-result'
import { DynamicForm } from './dynamic-form'
import { isRaffleDraw, isSocialRunWheelDraw, normalizeEventWheelDraw } from './event-draw-mode'
import { MechanicsPanel, mechanicKind } from './mechanics-panel'
import { mobileMechanicLabel } from './mobile-dynamics-home'
import { ParticipationPanel } from './participation-panel'

type WinnerDetails = { row: DynamicRow; list: ScannedParticipant[]; reveal: boolean } | null

export function MobileDynamicOperator({
  row,
  rows,
  brands,
  logos,
  editing,
  busy,
  confirmationOpen,
  winners,
  onBack,
  onEdit,
  onCancelEdit,
  onSave,
  onActivate,
  onDraw,
  onShowWinners,
  onAbsent,
  onCloseWinners,
  onRepeat,
  onReload,
}: {
  row: DynamicRow
  rows: DynamicRow[]
  brands: CommunityRecord[]
  logos: LogoItem[]
  editing: boolean
  busy: boolean
  confirmationOpen: boolean
  winners: WinnerDetails
  onBack: () => void
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (row: DynamicRow) => Promise<void>
  onActivate: () => Promise<void>
  onDraw: () => void
  onShowWinners: () => Promise<void>
  onAbsent: (winner: ScannedParticipant, place: number) => void
  onCloseWinners: () => void
  onRepeat: () => void
  onReload: () => Promise<void>
}) {
  const [demoNumber, setDemoNumber] = useState<number | null>(null)
  const completed = row.status === 'completed' || row.status === 'closed'
  const draft = row.status === 'draft'
  const open = row.status === 'open'
  const mechanic = mechanicKind(row)
  const raffle = isRaffleDraw(row)
  const rouletteStyle = isSocialRunWheelDraw(row)
  const currentWinners = winners?.row.id === row.id ? winners : null
  const needsReview = row.config?.pending_review === true
  const canActivate = !needsReview && !(row.type === 'challenge' && !row.description?.trim())
  const blocked = open && needsReview

  return (
    <section className="flex flex-col gap-4 md:hidden" aria-label={`Operar ${row.name}`}>
      <button type="button" className="text-link min-h-11 self-start" onClick={onBack}>
        <ArrowLeft aria-hidden className="size-4" /> Dinámicas
      </button>
      <header className="rounded-card border border-neo-border bg-neo-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold tracking-wide text-neo-accent-text uppercase">
            {mobileMechanicLabel(row)}
          </span>
          <span className="rounded-full border border-neo-border px-3 py-1 text-xs font-bold">
            {open ? 'Activa' : draft ? 'Pendiente' : dynamicStates[row.status]}
          </span>
        </div>
        <h3 className="mt-2 mb-0 text-xl font-black tracking-tight break-words">{row.name}</h3>
        {row.prize && <p className="m-0 mt-1 text-sm text-neo-text-secondary">{row.prize}</p>}
        {!editing && (
          <button type="button" className="text-link mt-3 min-h-11 text-sm" onClick={onEdit}>
            <Pencil aria-hidden className="size-4" />
            Editar
          </button>
        )}
      </header>

      {editing ? (
        <DynamicForm
          key={row.id}
          row={normalizeEventWheelDraw(row)}
          brands={brands}
          logos={logos}
          dynamics={rows}
          onSave={onSave}
          onCancel={onCancelEdit}
        />
      ) : draft ? (
        <div className="flex flex-col gap-3 rounded-card border border-neo-border bg-neo-surface p-4">
          <div className="flex items-center gap-2 font-bold">
            <Zap aria-hidden className="size-5 text-neo-accent-text" />
            {needsReview ? 'Revisar antes de activar' : 'Lista para operar'}
          </div>
          <p className="m-0 text-sm text-neo-text-secondary">
            {needsReview
              ? 'Confirma premios y reglas. Después podrás activarla.'
              : 'Una vez activa podrás registrar participantes o sortear aquí mismo.'}
          </p>
          <button
            type="button"
            className="button min-h-14 w-full justify-center"
            disabled={busy}
            onClick={() => {
              if (canActivate) void onActivate()
              else onEdit()
            }}
          >
            {canActivate ? (
              <>
                <Play aria-hidden className="size-5" /> Activar dinámica
              </>
            ) : (
              <>
                <Pencil aria-hidden className="size-5" /> Completar configuración
              </>
            )}
          </button>
        </div>
      ) : blocked ? (
        <div className="flex flex-col gap-3 rounded-card border border-neo-accent-border bg-neo-accent-soft p-4">
          <strong className="text-lg">Revisar antes de operar</strong>
          <p className="m-0 text-sm">
            Esta actividad está marcada para revisión. Confirma las reglas y premios antes de
            registrar participantes o asignar ganadores.
          </p>
          <button type="button" className="button min-h-12 justify-center" onClick={onEdit}>
            <Pencil aria-hidden className="size-4" /> Revisar configuración
          </button>
        </div>
      ) : raffle ? (
        <>
          {demoNumber !== null ? (
            <div className="rounded-card border border-neo-accent-border bg-neo-accent-soft p-5 text-center">
              <span className="inline-flex rounded-full border border-neo-accent-border px-3 py-1 text-xs font-black tracking-wide uppercase">
                Ensayo · Sin premios reales
              </span>
              <div className="mx-auto my-5 flex size-28 items-center justify-center rounded-full border-[7px] border-dashed border-neo-accent-text motion-safe:animate-[reveal_400ms_ease-out]">
                <Gift aria-hidden className="size-12 text-neo-accent-text" />
              </div>
              <h4 className="m-0 text-2xl font-black">Participante de prueba {demoNumber}</h4>
              <p className="mt-2 text-sm text-neo-text-secondary">
                Simulación visual: no se eligió un corredor real ni se guardó ningún premio.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" className="button button-secondary min-h-12 justify-center"
                  onClick={() => setDemoNumber(null)}>
                  Volver
                </button>
                <button type="button" className="button min-h-12 justify-center"
                  onClick={() => setDemoNumber((current) => current === 3 ? 1 : (current ?? 0) + 1)}>
                  Otra prueba
                </button>
              </div>
            </div>
          ) : currentWinners ? (
            <DrawResult
              key={row.id}
              name={row.name}
              winners={currentWinners.list}
              reveal={currentWinners.reveal}
              presentation={rouletteStyle ? 'wheel' : 'raffle'}
              busy={busy || confirmationOpen}
              onAbsent={onAbsent}
              onClose={onCloseWinners}
            />
          ) : open ? (
            <div className="flex flex-col gap-3 rounded-card border border-neo-border bg-neo-surface p-5">
              <Trophy aria-hidden className="size-8 text-neo-accent-text" />
              <h4 className="m-0 text-lg font-black">Sorteo aleatorio</h4>
              <p className="m-0 text-sm text-neo-text-secondary">
                {row.winner_count} {row.winner_count === 1 ? 'ganador' : 'ganadores'}.
                {rouletteStyle ? ' La ruleta muestra al ganador, no exige un QR por giro.' : ''}
              </p>
              <p className="m-0 text-xs text-neo-text-secondary">
                Elegibles: {row.requires_checkin ? 'con check-in' : 'personas inscritas'}
                {row.config?.exclude_winners === true ? ' · sin ganadores anteriores' : ''}.
              </p>
              <button
                type="button"
                disabled={busy || confirmationOpen}
                onClick={onDraw}
                className="button min-h-14 w-full justify-center text-base"
              >
                <Zap aria-hidden className="size-5" /> Sortear ganadores
              </button>
              <button
                type="button"
                className="min-h-12 w-full text-sm font-bold text-neo-accent-text underline underline-offset-4"
                onClick={() => setDemoNumber(1)}
              >
                Ensayar sin entregar premios
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-card border border-neo-border bg-neo-surface p-5 text-center">
              <CheckCircle2 aria-hidden className="size-9 text-neo-accent-text" />
              <strong className="text-lg">Sorteo finalizado</strong>
              <button
                type="button"
                className="button min-h-12 w-full justify-center"
                disabled={busy}
                onClick={() => void onShowWinners()}
              >
                <Trophy aria-hidden className="size-5" /> Ver ganadores
              </button>
            </div>
          )}
        </>
      ) : mechanic ? (
        <MechanicsPanel
          key={row.id}
          dynamic={row}
          compact
          resultsOnly={completed}
          onUpdated={onReload}
        />
      ) : open ? (
        <div className="rounded-card border border-neo-border bg-neo-surface p-4">
          <h4 className="m-0 text-lg font-black">Registrar participación</h4>
          <ParticipationPanel key={row.id} dynamic={row} onClose={onBack} />
        </div>
      ) : (
        <div className="rounded-card border border-neo-border bg-neo-surface p-5">
          <CheckCircle2 aria-hidden className="size-7 text-neo-accent-text" />
          <h4 className="mt-2 mb-0 text-lg font-black">Actividad finalizada</h4>
          <p className="m-0 mt-2 text-sm text-neo-text-secondary">
            {row.participations_count ?? 0} participaciones registradas
          </p>
        </div>
      )}

      {!editing && completed && (
        <button
          type="button"
          className="button button-secondary min-h-12 w-full justify-center"
          onClick={onRepeat}
        >
          <Copy aria-hidden className="size-4" /> Repetir como nueva dinámica
        </button>
      )}
    </section>
  )
}
