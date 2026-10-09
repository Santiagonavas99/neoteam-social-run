'use client'

import { ArrowLeft, Play, Plus, ScanLine, Trash2, Zap } from 'lucide-react'
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
type DetailTab = 'preparar' | 'en-vivo' | 'resultados'
const tabLabels: Record<DetailTab, string> = {
  preparar: 'Preparación',
  'en-vivo': 'En vivo',
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
    eligible + ' participantes elegibles',
    parts.length ? '(' + parts.join(', ') + ')' : '',
    '· hasta ' +
      Math.min(row.winner_count, eligible) +
      ' ganadores. El sorteo real guarda sus resultados.',
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
  const [tab, setTab] = useState<DetailTab>('preparar')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [scanning, setScanning] = useState(false)
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
    setSettingsOpen(false)
  }

  function open(row: DynamicRow) {
    setSelectedId(row.id)
    setTab(row.status === 'draft' ? 'preparar' : row.status === 'completed' ? 'resultados' : 'en-vivo')
    setCreating(false)
    setScanning(false)
    setSettingsOpen(false)
    dynamics.setEditor(null)
    dynamics.setWinners(null)
    dynamics.setFeedback(null)
    if (row.status === 'completed' && row.type === 'raffle') {
      void dynamics.showWinners(row)
    }
  }

  function chooseTab(item: DetailTab, row: DynamicRow) {
    setTab(item)
    setScanning(false)
    setSettingsOpen(false)
    dynamics.setEditor(null)
    if (item === 'resultados' && row.type === 'raffle' && row.status === 'completed') {
      void dynamics.showWinners(row)
    }
  }

  function back() {
    setSelectedId(null)
    setTab('preparar')
    setScanning(false)
    setSettingsOpen(false)
    dynamics.setEditor(null)
    dynamics.setWinners(null)
  }

  const confirmationPanel =
    confirmation?.action === 'draw' ? (
      <ConfirmPanel
        kind="draw"
        title={'¿Todo listo para “' + confirmation.row.name + '”?'}
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
        title={confirmation.winner.firstName + ' no está. ¿Sortear reemplazo?'}
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
        title={'¿Eliminar “' + confirmation.row.name + '” ?'}
        text="Se eliminará esta dinámica y todas sus participaciones. No se puede deshacer."
        confirmLabel="Sí, eliminar"
        busy={busy}
        onCancel={() => dynamics.setConfirmation(null)}
        onConfirm={() => void dynamics.confirm()}
      />
    ) : confirmation?.action === 'deleteDrafts' ? (
      <ConfirmPanel
        kind="delete"
        title={'¿Eliminar los ' + confirmation.drafts.length + ' borradores?'}
        text="Se perderán las configuraciones de los borradores y sus participaciones."
        confirmLabel="Eliminar borradores"
        busy={busy}
        onCancel={() => dynamics.setConfirmation(null)}
        onConfirm={() => void dynamics.confirm()}
      />
    ) : null

  return (
    <section aria-busy={loading || busy} className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="m-0 text-xs font-bold tracking-widest text-neo-accent-text uppercase">
            NeoTeam · Día del evento
          </p>
          <h2 className="m-0 mt-1 text-2xl font-black tracking-tight sm:text-3xl">Dinámicas</h2>
          <p className="m-0 mt-2 max-w-xl text-sm text-neo-text-secondary">
            Prepara tus actividades con calma. El día del evento, entra en «Control» para
            ejecutarlas.
          </p>
        </div>
        {!selected && !creating && (
          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={() => setCreating(true)}
          >
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
                <p className="m-0 text-xs font-bold text-neo-accent-text uppercase">
                  {dynamicTypes[selected.type]}
                </p>
                <h3 className="m-0 mt-2 text-2xl font-black tracking-tight break-words">
                  {selected.name}
                </h3>
                {selected.prize && (
                  <p className="m-0 mt-1 text-sm text-neo-text-secondary">{selected.prize}</p>
                )}
              </div>
              <StatusBadge status={selected.status} label={dynamicStates[selected.status]} />
            </div>
            <nav
              className="mt-6 grid max-w-xl grid-cols-3 gap-1 rounded-control bg-neo-muted-bg p-1"
              aria-label="Secciones de la dinámica"
            >
              {(Object.keys(tabLabels) as DetailTab[]).map((item) => (
                <button
                  type="button"
                  key={item}
                  aria-current={tab === item ? 'page' : undefined}
                  onClick={() => chooseTab(item, selected)}
                  className={
                    'min-h-11 rounded-control px-2 text-sm font-bold transition-colors ' +
                    (tab === item
                      ? 'bg-neo-text text-neo-surface'
                      : 'text-neo-text-secondary hover:bg-neo-surface')
                  }
                >
                  {tabLabels[item]}
                </button>
              ))}
            </nav>
          </div>

          {tab === 'preparar' && (
            <div className="flex flex-col gap-4">
              {settingsOpen ? (
                <DynamicForm
                  key={selected.id}
                  row={editor?.id === selected.id ? editor : selected}
                  brands={sponsors.data}
                  dynamics={rows}
                  onSave={save}
                  onCancel={() => setSettingsOpen(false)}
                />
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      ['Participaciones', String(selected.participations_count ?? 0)],
                      ['Ganadores', String(selected.winners_count ?? 0)],
                      ['Check-in', selected.requires_checkin ? 'Sí' : 'No'],
                    ].map(([title, value]) => (
                      <div
                        key={title}
                        className="min-w-0 rounded-card border border-neo-border bg-neo-surface p-3 sm:p-5"
                      >
                        <p className="m-0 text-xs font-bold text-neo-text-secondary">{title}</p>
                        <p className="m-0 mt-2 text-2xl font-black">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-neo-border bg-neo-surface p-5">
                    {selected.status === 'draft' ? (
                      <>
                        <div>
                          <p className="m-0 font-bold">Lista para activar</p>
                          <p className="m-0 mt-1 text-xs text-neo-text-secondary">
                            Comprueba la configuración antes de abrir la participación.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="button"
                          disabled={busy}
                          onClick={() => void dynamics.activate(selected)}
                        >
                          <Play aria-hidden className="size-4" /> Activar dinámica
                        </button>
                      </>
                    ) : (
                      <p className="m-0 text-sm text-neo-text-secondary">
                        {selected.status === 'open'
                          ? 'La dinámica está activa y puedes dirigirla desde En vivo.'
                          : 'La dinámica ya tiene un estado registrado.'}
                      </p>
                    )}
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setSettingsOpen(true)}
                    >
                      Editar ajustes
                    </button>
                  </div>
                </>
              )}
              <details className="rounded-control border border-neo-border bg-neo-surface p-4">
                <summary className="cursor-pointer text-xs font-bold text-neo-text-secondary">
                  Opciones avanzadas
                </summary>
                <button
                  type="button"
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-neo-danger"
                  disabled={busy}
                  onClick={() => dynamics.setConfirmation({ row: selected, action: 'delete' })}
                >
                  <Trash2 aria-hidden className="size-4" /> Eliminar dinámica
                </button>
              </details>
            </div>
          )}

          {tab === 'en-vivo' && (
            <>
              <GameControlPanel
                key={selected.id}
                dynamic={selected}
                onDraw={() => void dynamics.askDraw(selected)}
              />
              {selected.type !== 'raffle' && selected.status === 'open' && (
                <div className="rounded-card border border-neo-border bg-neo-surface p-5">
                  {!scanning ? (
                    <button
                      type="button"
                      className="button"
                      onClick={() => setScanning(true)}
                    >
                      <ScanLine aria-hidden className="size-4" /> Registrar participación
                    </button>
                  ) : (
                    <ParticipationPanel dynamic={selected} onClose={() => setScanning(false)} />
                  )}
                </div>
              )}
            </>
          )}

          {tab === 'resultados' && (
            <>
              {winners?.row.id === selected.id ? (
                <DrawResult
                  name={selected.name}
                  winners={winners.list}
                  reveal={false}
                  busy={busy || !!confirmation}
                  onAbsent={(winner, place) =>
                    dynamics.setConfirmation({ row: selected, winner, place, action: 'redraw' })
                  }
                  onClose={() => dynamics.setWinners(null)}
                />
              ) : (
                <p className="rounded-card border border-neo-border bg-neo-surface p-6 text-sm text-neo-text-secondary">
                  {selected.status === 'completed' && selected.type === 'raffle'
                    ? 'Cargando ganadores…'
                    : selected.status === 'completed'
                      ? 'La actividad está completada. Consulta las participaciones en el panel.'
                      : 'Los resultados aparecerán aquí cuando termine la dinámica.'}
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
              <div
                key={label}
                className="rounded-card border border-neo-border bg-neo-surface p-4 md:p-5"
              >
                <p className="m-0 text-xs text-neo-text-secondary">{label}</p>
                <p className="m-0 mt-1 text-2xl font-black tabular-nums sm:text-3xl">{count}</p>
              </div>
            ))}
          </div>
          <nav aria-label="Categorías de dinámicas" className="flex flex-wrap gap-2">
            {(['raffles', 'stands', 'instant'] as Category[]).map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className={
                  'min-h-11 rounded-control border px-4 text-sm font-bold ' +
                  (category === item
                    ? 'border-neo-text bg-neo-text text-neo-surface'
                    : 'border-neo-border bg-neo-surface hover:bg-neo-muted-bg')
                }
              >
                {categoryLabel(item)} (
                {rows.filter((row) => categoryTypes[item].includes(row.type)).length})
              </button>
            ))}
          </nav>
          <label className="max-w-lg">
            Buscar {categoryLabel(category).toLowerCase()}
            <input
              type="search"
              placeholder="Nombre, premio o actividad…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          {loading ? (
            <LoadingState>Cargando dinámicas…</LoadingState>
          ) : visible.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {visible.map((row) => (
                <article
                  key={row.id}
                  className="flex min-w-0 flex-col justify-between rounded-card border border-neo-border bg-neo-surface p-5"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-neo-accent-text uppercase">
                        {dynamicTypes[row.type]}
                      </span>
                      <StatusBadge status={row.status} label={dynamicStates[row.status]} />
                    </div>
                    <h3 className="m-0 mt-3 text-xl font-black tracking-tight break-words">
                      {row.name}
                    </h3>
                    <p className="m-0 mt-1 text-sm text-neo-text-secondary">
                      {row.prize || row.description || 'Actividad del Social Run'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-neo-text-secondary">
                      <span>{row.participations_count ?? 0} participaciones</span>
                      {row.type === 'raffle' && <span>{row.winner_count} premios</span>}
                      <span>{row.requires_checkin ? 'Requiere check-in' : 'Sin check-in'}</span>
                    </div>
                  </div>
                  <div className="mt-5 border-t border-neo-border pt-4">
                    <button
                      type="button"
                      className="button w-full justify-center"
                      onClick={() => open(row)}
                    >
                      {row.status === 'draft'
                        ? 'Preparar dinámica'
                        : row.status === 'completed'
                          ? 'Ver resultados'
                          : 'Abrir control'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : query ? (
            <NoMatches onClear={() => setQuery('')} />
          ) : (
            <EmptyState
              icon={Zap}
              title={'Sin ' + categoryLabel(category).toLowerCase()}
              text="Crea una dinámica con el asistente. Podrás configurarla antes de activarla."
            />
          )}
          {(dynamics.ranking.length > 0 || drafts.length > 0) && (
            <details className="rounded-control border border-neo-border bg-neo-surface p-4">
              <summary className="cursor-pointer text-sm font-bold text-neo-text-secondary">
                Herramientas avanzadas
              </summary>
              <div className="mt-4 grid gap-4">
                {dynamics.ranking.length > 0 && <Ranking runners={dynamics.ranking} />}
                {drafts.length > 0 && (
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-neo-danger"
                    disabled={busy}
                    onClick={() => dynamics.setConfirmation({ action: 'deleteDrafts', drafts })}
                  >
                    <Trash2 aria-hidden className="size-4" />
                    Eliminar borradores ({drafts.length})
                  </button>
                )}
              </div>
            </details>
          )}
        </>
      )}
    </section>
  )
}
