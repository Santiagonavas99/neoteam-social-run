'use client'

import {
  ArrowLeft,
  ArrowUpRight,
  Dices,
  MonitorPlay,
  Play,
  Plus,
  ScanLine,
  Trash2,
  Trophy,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { callAdmin } from '../api'
import { matchesQuery } from '../filter'
import { dynamicStates, dynamicTypes, raffleGenders } from '../labels'
import type { CommunityRecord, DynamicRow } from '../types'
import { Feedback, StatusBadge } from '../ui/admin-ui'
import { ConfirmPanel } from '../ui/confirm-panel'
import { EmptyState, NoMatches } from '../ui/empty-state'
import { LoadingState } from '../ui/loading-state'
import { useAdminData } from '../ui/use-admin-data'
import { DrawResult } from './draw-result'
import { DynamicCreateWizard } from './dynamic-create-wizard'
import { DynamicForm } from './dynamic-form'
import { GameControlPanel } from './game-control-panel'
import { ParticipationPanel } from './participation-panel'
import { Ranking } from './ranking'
import { useDynamics } from './use-dynamics'

type Category = 'raffles' | 'stands' | 'instant'
type DetailTab = 'resumen' | 'configuracion' | 'control' | 'pantalla' | 'resultados'
const tabLabels: Record<DetailTab, string> = {
  resumen: 'Resumen',
  configuracion: 'Configuración',
  control: 'Control',
  pantalla: 'Pantalla pública',
  resultados: 'Resultados',
}

const categoryTypes: Record<Category, string[]> = {
  raffles: ['raffle'],
  stands: ['qr', 'checkpoint', 'challenge', 'trivia', 'mission', 'voting', 'points'],
  instant: ['instant_win'],
}

function categoryLabel(category: Category) {
  return category === 'raffles'
    ? 'Sorteos'
    : category === 'stands'
      ? 'Stands y retos'
      : 'Premios instantáneos'
}

function ruleDescription(row: DynamicRow, eligible: number | null) {
  if (eligible === null) return 'Calculando participantes elegibles…'
  if (eligible === 0)
    return 'Todavía no hay corredores elegibles. Revisa las condiciones y el check-in.'
  const parts = [
    row.requires_checkin ? 'con check-in' : 'inscritos',
    row.config?.gender ? raffleGenders[String(row.config.gender)]?.toLowerCase() : '',
    row.eligibility_dynamic_id ? 'que completaron la actividad vinculada' : '',
    row.config?.exclude_winners === true ? 'sin ganadores anteriores' : '',
  ].filter(Boolean)
  return [
    `${eligible} participantes elegibles`,
    parts.length ? `(${parts.join(', ')})` : '',
    `· hasta ${Math.min(row.winner_count, eligible)} ganadores. El sorteo real guarda sus resultados.`,
  ].join(' ')
}

export function DynamicsView() {
  const dynamics = useDynamics()
  const { rows, busy, feedback, editor, confirmation, winners } = dynamics
  const loadBrands = useCallback(
    async () =>
      (await callAdmin<CommunityRecord>('adminData', { resource: 'brands', operation: 'list' }))
        .rows ?? [],
    [],
  )
  const sponsors = useAdminData<CommunityRecord[]>(loadBrands, [], dynamics.onError)
  const [category, setCategory] = useState<Category>('raffles')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<DetailTab>('resumen')
  const [creating, setCreating] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [showRanking, setShowRanking] = useState(false)
  const loading = dynamics.loading || sponsors.loading
  const selected = rows.find((row) => row.id === selectedId) ?? null
  const visible = rows.filter(
    (row) =>
      categoryTypes[category].includes(row.type) &&
      matchesQuery([row.name, row.description, row.prize, dynamicTypes[row.type]], query),
  )
  const drafts = rows.filter((row) => row.status === 'draft')
  const counts = {
    draft: rows.filter((row) => row.status === 'draft').length,
    open: rows.filter((row) => row.status === 'open').length,
    completed: rows.filter((row) => row.status === 'completed').length,
  }

  async function save(row: DynamicRow) {
    await dynamics.save(row)
    setCreating(false)
  }

  function open(row: DynamicRow, nextTab: DetailTab = 'resumen') {
    setSelectedId(row.id)
    setTab(nextTab)
    setCreating(false)
    setScanning(false)
    dynamics.setEditor(null)
    dynamics.setWinners(null)
    dynamics.setFeedback(null)
  }

  function back() {
    setSelectedId(null)
    setTab('resumen')
    setScanning(false)
    dynamics.setEditor(null)
    dynamics.setWinners(null)
  }

  const confirmationPanel =
    confirmation?.action === 'draw' ? (
      <ConfirmPanel
        kind="draw"
        title={`¿Todo listo para “${confirmation.row.name}”?`}
        text={ruleDescription(confirmation.row, dynamics.eligible)}
        confirmLabel="Confirmar sorteo real"
        busy={busy}
        confirmDisabled={!dynamics.eligible}
        onCancel={() => dynamics.setConfirmation(null)}
        onConfirm={() => void dynamics.confirm()}
      />
    ) : confirmation?.action === 'redraw' ? (
      <ConfirmPanel
        kind="draw"
        title={`${confirmation.winner.firstName} no está. ¿Sortear reemplazo?`}
        text={
          'Se marcará como ausente y se buscará otra persona para el puesto ' +
          confirmation.place +
          '. Los demás ganadores no cambian.'
        }
        confirmLabel="Buscar reemplazo"
        busy={busy}
        onCancel={() => dynamics.setConfirmation(null)}
        onConfirm={() => void dynamics.confirm()}
      />
    ) : confirmation?.action === 'delete' ? (
      <ConfirmPanel
        kind="delete"
        title={`¿Eliminar “${confirmation.row.name}”?`}
        text="Se eliminará esta dinámica y todas sus participaciones. No se puede deshacer."
        confirmLabel="Sí, eliminar"
        busy={busy}
        onCancel={() => dynamics.setConfirmation(null)}
        onConfirm={() => void dynamics.confirm()}
      />
    ) : confirmation?.action === 'deleteDrafts' ? (
      <ConfirmPanel
        kind="delete"
        title={`¿Eliminar los ${confirmation.drafts.length} borradores?`}

  return (
    <section aria-busy={loading || busy} className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="m-0 text-xs font-bold tracking-widest text-neo-accent-text uppercase">NeoTeam · Día del evento</p>
          <h2 className="m-0 mt-1 text-2xl font-black tracking-tight sm:text-3xl">Dinámicas</h2>
          <p className="m-0 mt-2 max-w-xl text-sm text-neo-text-secondary">
            Prepara tus actividades con calma. El día del evento, entra en «Control» para ejecutarlas.
          </p>
        </div>
        {!selected && !creating && (
          <button type="button" className="button" disabled={busy} onClick={() => setCreating(true)}>
            <Plus aria-hidden className="size-4" /> Nueva dinámica
          </button>
        )}
      </header>

      <Feedback value={feedback} />
      {confirmationPanel}

      {creating ? (
        <DynamicCreateWizard
          brands={sponsors.data}
          dynamics={rows}
          onSave={save}
          onCancel={() => setCreating(false)}
        />
      ) : selected ? (
        <>
          <button type="button" className="text-link self-start" onClick={back}>
            <ArrowLeft aria-hidden className="size-4" /> Volver a dinámicas
          </button>
          <div className="rounded-card border border-neo-border bg-neo-surface p-5 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 text-xs font-bold text-neo-accent-text uppercase">{dynamicTypes[selected.type]}</p>
                <h3 className="m-0 mt-2 text-2xl font-black tracking-tight break-words">{selected.name}</h3>
                {selected.prize && <p className="m-0 mt-1 text-sm text-neo-text-secondary">{selected.prize}</p>}
              </div>
              <StatusBadge status={selected.status} label={dynamicStates[selected.status]} />
            </div>
            <nav className="mt-6 flex flex-wrap gap-2 border-t border-neo-border pt-4" aria-label="Secciones de la dinámica">
              {(Object.keys(tabLabels) as DetailTab[]).map((item) => (
                <button
                  type="button"
                  key={item}
                  aria-current={tab === item ? 'page' : undefined}
                  onClick={() => {
                    setTab(item)
                    setScanning(false)
                    dynamics.setEditor(null)
                  }}
                  className={'min-h-11 rounded-control border px-3 text-sm font-bold ' +
                    (tab === item ? 'border-neo-text bg-neo-text text-neo-surface' :
                      'border-neo-border hover:bg-neo-muted-bg')}
                >
                  {tabLabels[item]}
                </button>
              ))}
            </nav>
          </div>

          {tab === 'resumen' && (
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['Participaciones', String(selected.participations_count ?? 0)],
                ['Ganadores', String(selected.winners_count ?? 0)],
                ['Check-in obligatorio', selected.requires_checkin ? 'Sí' : 'No'],
              ].map(([title, value]) => (
                <div key={title} className="rounded-card border border-neo-border bg-neo-surface p-5">
                  <p className="m-0 text-xs font-bold text-neo-text-secondary">{title}</p>
                  <p className="m-0 mt-2 text-3xl font-black">{value}</p>
                </div>
              ))}
              <div className="md:col-span-3 flex flex-wrap gap-3 rounded-card border border-neo-border bg-neo-surface p-5">
                {selected.status === 'draft' && (
                  <button type="button" className="button" disabled={busy} onClick={() => void dynamics.activate(selected)}>
                    <Play aria-hidden className="size-4" /> Activar dinámica
                  </button>
                )}
                <button type="button" className="button button-secondary" onClick={() => setTab('configuracion')}>
                  Revisar configuración
                </button>
                <button type="button" className="button" onClick={() => setTab('control')}>
                  Abrir panel de control
                </button>
              </div>
            </div>
          )}

          {tab === 'configuracion' && (
            <DynamicForm
              key={selected.id}
              row={editor?.id === selected.id ? editor : selected}
              brands={sponsors.data}
              dynamics={rows}
              onSave={save}
              onCancel={() => setTab('resumen')}
              onDelete={() => dynamics.setConfirmation({ row: selected, action: 'delete' })}
            />
          )}

          {tab === 'control' && (
            <>
              <GameControlPanel
                dynamic={selected}
                onDraw={() => void dynamics.askDraw(selected)}
                onShowWinners={() => void dynamics.showWinners(selected)}
              />
              {selected.type !== 'raffle' && selected.status === 'open' && (
                <div className="rounded-card border border-neo-border bg-neo-surface p-5">
                  <button type="button" className="button" onClick={() => setScanning((value) => !value)}>
                    <ScanLine aria-hidden className="size-4" />
                    {scanning ? 'Cerrar escáner' : 'Registrar participación'}
                  </button>
                  {scanning && <ParticipationPanel dynamic={selected} onClose={() => setScanning(false)} />}
                </div>
              )}
              {winners?.row.id === selected.id && (
                <DrawResult
                  name={selected.name}
                  winners={winners.list}
                  reveal={winners.reveal}
                  busy={busy || !!confirmation}
                  onAbsent={(winner, place) => dynamics.setConfirmation({ row: selected, winner, place, action: 'redraw' })}
                  onClose={() => dynamics.setWinners(null)}
                />
              )}
            </>
          )}

          {tab === 'pantalla' && (
            <div className="rounded-card border border-neo-border bg-neo-surface p-6">
              <MonitorPlay aria-hidden className="mb-3 size-9 text-neo-accent-text" />
              <h3 className="m-0 text-xl font-bold">Pantalla de juego</h3>
              <p className="mt-2 text-sm text-neo-text-secondary">
                Abre esta pantalla en un televisor, proyector u otro dispositivo.
                El panel de control es privado; los espectadores solo ven el espectáculo.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link className="button" href={`/juego/${selected.id}`} target="_blank" rel="noopener noreferrer">
                  Abrir pantalla real <ArrowUpRight aria-hidden className="size-4" />
                </Link>
                <Link className="button button-secondary" href={`/juego/${selected.id}?ensayo=1`} target="_blank" rel="noopener noreferrer">
                  Probar en modo ensayo <ArrowUpRight aria-hidden className="size-4" />
                </Link>
              </div>
              <p className="mt-5 text-xs text-neo-text-secondary">
                El ensayo utiliza nombres ficticios y nunca ejecuta un sorteo real.
              </p>
            </div>
          )}

          {tab === 'resultados' && (
            <>
              {selected.type === 'raffle' && selected.status === 'completed' && (
                <button type="button" className="button self-start" onClick={() => void dynamics.showWinners(selected)}>
                  <Trophy aria-hidden className="size-4" /> Consultar ganadores
                </button>
              )}
              {winners?.row.id === selected.id ? (
                <DrawResult
                  name={selected.name}
                  winners={winners.list}
                  reveal={false}
                  busy={busy || !!confirmation}
                  onAbsent={(winner, place) => dynamics.setConfirmation({ row: selected, winner, place, action: 'redraw' })}
                  onClose={() => dynamics.setWinners(null)}
                />
              ) : (
                <p className="rounded-card border border-neo-border bg-neo-surface p-6 text-sm text-neo-text-secondary">
                  {selected.status === 'completed'
                    ? 'Consulta los resultados para ver la lista de ganadores.'
                    : 'Los resultados estarán disponibles después de finalizar la dinámica.'}
                </p>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Borradores', counts.draft],
              ['Activas', counts.open],
              ['Completadas', counts.completed],
            ].map(([label, count]) => (
              <div key={label} className="rounded-card border border-neo-border bg-neo-surface p-4 md:p-5">
                <p className="m-0 text-xs text-neo-text-secondary">{label}</p>
                <p className="m-0 mt-1 text-2xl font-black tabular-nums sm:text-3xl">{count}</p>
              </div>
            ))}
          </div>
          <nav aria-label="Categorías de dinámicas" className="flex flex-wrap gap-2">
            {(['raffles','stands','instant'] as Category[]).map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className={'min-h-11 rounded-control border px-4 text-sm font-bold ' +
                  (category === item ? 'border-neo-text bg-neo-text text-neo-surface' :
                    'border-neo-border bg-neo-surface hover:bg-neo-muted-bg')}
              >
                {categoryLabel(item)} ({rows.filter((row) => categoryTypes[item].includes(row.type)).length})
              </button>
            ))}
          </nav>
          <label className="max-w-lg">Buscar {categoryLabel(category).toLowerCase()}
            <input type="search" placeholder="Nombre, premio o actividad…" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>

          {loading ? (
            <LoadingState>Cargando dinámicas…</LoadingState>
          ) : visible.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {visible.map((row) => (
                <article key={row.id} className="flex min-w-0 flex-col justify-between rounded-card border border-neo-border bg-neo-surface p-5">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-neo-accent-text uppercase">{dynamicTypes[row.type]}</span>
                      <StatusBadge status={row.status} label={dynamicStates[row.status]} />
                    </div>
                    <h3 className="m-0 mt-3 text-xl font-black tracking-tight break-words">{row.name}</h3>
                    <p className="m-0 mt-1 text-sm text-neo-text-secondary">{row.prize || row.description || 'Actividad del Social Run'}</p>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-neo-text-secondary">
                      <span>{row.participations_count ?? 0} participaciones</span>
                      {row.type === 'raffle' && <span>{row.winner_count} premios</span>}
                      <span>{row.requires_checkin ? 'Requiere check-in' : 'Sin check-in'}</span>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-neo-border pt-4">
                    <button type="button" className="button button-secondary" onClick={() => open(row)}>
                      Ver dinámica
                    </button>
                    {row.status === 'draft' && (
                      <button type="button" className="button" disabled={busy} onClick={() => void dynamics.activate(row)}>
                        <Play aria-hidden className="size-4" /> Activar
                      </button>
                    )}
                    {row.status === 'open' && (
                      <button type="button" className="button" onClick={() => open(row, 'control')}>
                        {row.type === 'raffle' ? <Dices aria-hidden className="size-4" /> : <ScanLine aria-hidden className="size-4" />}
                        Ir a control
                      </button>
                    )}
                    {row.status === 'completed' && (
                      <button type="button" className="button button-secondary" onClick={() => open(row, 'resultados')}>
                        <Trophy aria-hidden className="size-4" /> Ver resultados
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : query ? (
            <NoMatches onClear={() => setQuery('')} />
          ) : (
            <EmptyState
              icon={Zap}
              title={`Sin ${categoryLabel(category).toLowerCase()}`}
              text="Crea una dinámica con el asistente. Podrás configurarla antes de activarla."
              action={<button type="button" className="button" onClick={() => setCreating(true)}><Plus aria-hidden className="size-4" /> Nueva dinámica</button>}
            />
          )}
          {!!dynamics.ranking.length && (
            <div className="mt-3">
              <button type="button" className="text-link" onClick={() => setShowRanking((value) => !value)}>
                {showRanking ? 'Ocultar ranking de puntos' : 'Ver ranking de puntos'}
              </button>
              {showRanking && <Ranking runners={dynamics.ranking} />}
            </div>
          )}
          {!!drafts.length && (
            <button
              type="button"
              className="text-link danger-text self-start"
              disabled={busy}
              onClick={() => dynamics.setConfirmation({ action: 'deleteDrafts', drafts })}
            >
              <Trash2 aria-hidden className="size-4" /> Eliminar borradores ({drafts.length})
            </button>
          )}
        </>
      )}
    </section>
  )
}
