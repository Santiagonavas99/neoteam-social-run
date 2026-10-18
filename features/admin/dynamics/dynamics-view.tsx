'use client'

import {
  ArrowLeft,
  ClipboardCheck,
  ClipboardList,
  Copy,
  MonitorPlay,
  Play,
  Plus,
  Settings2,
  Trash2,
  Trophy,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { callAdmin, callLogos } from '../api'
import { matchesQuery } from '../filter'
import { dynamicStates, dynamicTypes, raffleGenders } from '../labels'
import type { CommunityRecord, DynamicRow, LogoItem } from '../types'
import { Feedback, StatusBadge } from '../ui/admin-ui'
import { ConfirmPanel } from '../ui/confirm-panel'
import { EmptyState, NoMatches } from '../ui/empty-state'
import { LoadingState } from '../ui/loading-state'
import { useAdminData } from '../ui/use-admin-data'
import { DrawResult } from './draw-result'
import { duplicateDynamic } from './duplicate-dynamic'
import { DynamicCard } from './dynamic-card'
import { DynamicCreateWizard } from './dynamic-create-wizard'
import { DynamicForm } from './dynamic-form'
import { challengeNeedsRules, groupDynamicsByPhase, orderDynamicsByStatus } from './dynamics-order'
import styles from './dynamics-tabs.module.css'
import { GameControlPanel } from './game-control-panel'
import { MechanicsPanel, mechanicKind } from './mechanics-panel'
import { MobileDynamicsHome } from './mobile-dynamics-home'
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
const tabIcons = {
  preparar: ClipboardList,
  'en-vivo': MonitorPlay,
  resultados: Trophy,
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
  const loadLogos = useCallback(
    async () => (await callLogos<LogoItem>('list', { carousel_kind: 'brand' })).rows ?? [],
    [],
  )
  const sponsorLogos = useAdminData<LogoItem[]>(loadLogos, [], dynamics.onError)
  const [category, setCategory] = useState<Category>('raffles')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<DetailTab>('preparar')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [duplicate, setDuplicate] = useState<DynamicRow | null>(null)
  const [scanning, setScanning] = useState(false)
  const [preview, setPreview] = useState<{ id: string; rehearsal: boolean } | null>(null)
  const restored = useRef(false)

  function writeMobileUrl(id: string | null, section?: DetailTab) {
    if (typeof window === 'undefined' || !window.matchMedia('(max-width: 767px)').matches) {
      return
    }
    const url = new URL(window.location.href)
    if (id) {
      url.searchParams.set('dinamica', id)
      if (section) url.searchParams.set('seccion', section)
    } else {
      url.searchParams.delete('dinamica')
      url.searchParams.delete('seccion')
    }
    window.history.pushState(window.history.state, '', url)
  }

  useEffect(() => {
    if (restored.current || dynamics.loading) return
    restored.current = true
    const params = new URLSearchParams(window.location.search)
    const row = rows.find((item) => item.id === params.get('dinamica'))
    const section = params.get('seccion')
    if (row) {
      setSelectedId(row.id)
      setTab(section === 'preparar' || section === 'resultados' ? section : 'en-vivo')
    }
  }, [dynamics.loading, rows])

  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search)
      const row = rows.find((item) => item.id === params.get('dinamica'))
      const section = params.get('seccion')
      setSelectedId(row?.id ?? null)
      setTab(section === 'preparar' || section === 'resultados' ? section : 'en-vivo')
      setScanning(false)
      setPreview(null)
      setSettingsOpen(false)
      setCreating(false)
      setDuplicate(null)
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [rows])

  useEffect(() => {
    if (!preview) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreview(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [preview])
  const loading = dynamics.loading || sponsors.loading || sponsorLogos.loading
  const selected = rows.find((row) => row.id === selectedId) ?? null
  const visible = orderDynamicsByStatus(
    rows.filter(
      (row) =>
        categoryTypes[category].includes(row.type) &&
        matchesQuery([row.name, row.description, row.prize, dynamicTypes[row.type]], query),
    ),
  )
  const grouped = groupDynamicsByPhase(visible)
  const selectedNeedsRules = selected ? challengeNeedsRules(selected) : false
  const drafts = rows.filter((row) => row.status === 'draft')
  const counts = {
    draft: rows.filter((row) => row.status === 'draft').length,
    open: rows.filter((row) => row.status === 'open').length,
    completed: rows.filter((row) => row.status === 'completed').length,
  }

  async function save(row: DynamicRow) {
    await dynamics.save(row)
    setCreating(false)
    setDuplicate(null)
    setSettingsOpen(false)
  }

  function repeat(row: DynamicRow) {
    writeMobileUrl(null)
    setDuplicate(duplicateDynamic(row))
    setSelectedId(null)
    setCreating(false)
    setTab('preparar')
    setSettingsOpen(false)
    setScanning(false)
    dynamics.setEditor(null)
    dynamics.setWinners(null)
    dynamics.setFeedback(null)
  }

  function open(row: DynamicRow, target?: DetailTab) {
    const nextTab =
      target ??
      (row.status === 'draft' ? 'preparar' : row.status === 'completed' ? 'resultados' : 'en-vivo')
    writeMobileUrl(row.id, nextTab)
    setSelectedId(row.id)
    setTab(nextTab)
    setCreating(false)
    setScanning(
      nextTab === 'en-vivo' &&
        row.status === 'open' &&
        row.type !== 'raffle' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(max-width: 767px)').matches,
    )
    setSettingsOpen(false)
    dynamics.setEditor(null)
    dynamics.setWinners(null)
    dynamics.setFeedback(null)
    if (row.status === 'completed' && row.type === 'raffle') {
      void dynamics.showWinners(row)
    }
  }

  function chooseTab(item: DetailTab, row: DynamicRow) {
    writeMobileUrl(row.id, item)
    setTab(item)
    setScanning(false)
    setSettingsOpen(false)
    dynamics.setEditor(null)
    if (item === 'resultados' && row.type === 'raffle' && row.status === 'completed') {
      void dynamics.showWinners(row)
    }
  }

  function back() {
    writeMobileUrl(null)
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
        text={`Se marcará como ausente y se buscará otra persona para el puesto ${confirmation.place}. Los demás ganadores no cambian.`}
        confirmLabel="Buscar reemplazo"
        busy={busy}
        onCancel={() => dynamics.setConfirmation(null)}
        onConfirm={() => void dynamics.confirm()}
      />
    ) : confirmation?.action === 'delete' ? (
      <ConfirmPanel
        kind="delete"
        title={`¿Eliminar “${confirmation.row.name}” ?`}
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
            Identifica lo que está activo, abre el control con PLAY y prepara el resto sin perderte.
          </p>
        </div>
        {!selected && !creating && !duplicate && (
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
      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vista pública de la dinámica"
          className="fixed inset-0 z-50 hidden flex-col bg-neo-surface md:flex"
        >
          <div className="flex min-h-16 items-center justify-between gap-3 border-b border-neo-border px-4">
            <strong className="text-sm">Vista pública {preview.rehearsal ? '· Ensayo' : ''}</strong>
            <button
              type="button"
              className="button button-secondary min-h-11"
              onClick={() => setPreview(null)}
            >
              <ArrowLeft aria-hidden className="size-4" /> Volver al control
            </button>
          </div>
          <iframe
            title="Presentación pública integrada"
            className="min-h-0 w-full flex-1 border-0"
            src={`/juego/${preview.id}${preview.rehearsal ? '?ensayo=1' : ''}`}
          />
        </div>
      )}

      {duplicate ? (
        <div>
          <button type="button" className="text-link mb-4" onClick={() => setDuplicate(null)}>
            <ArrowLeft aria-hidden className="size-4" /> Volver a dinámicas
          </button>
          <DynamicForm
            key={duplicate.id}
            row={duplicate}
            cloneMode
            brands={sponsors.data}
            logos={sponsorLogos.data}
            dynamics={rows}
            onSave={save}
            onCancel={() => setDuplicate(null)}
          />
        </div>
      ) : creating ? (
        <DynamicCreateWizard
          brands={sponsors.data}
          logos={sponsorLogos.data}
          dynamics={rows}
          onSave={save}
          onCancel={() => setCreating(false)}
        />
      ) : selected ? (
        <>
          <button type="button" className="text-link self-start" onClick={back}>
            <ArrowLeft aria-hidden className="size-4" /> Volver a dinámicas
          </button>
          {selected.status === 'open' && rows.filter((row) => row.status === 'open').length > 1 && (
            <label className="md:hidden">
              Cambiar dinámica activa
              <select
                value={selected.id}
                className="mt-1 min-h-12"
                onChange={(event) => {
                  const next = rows.find((row) => row.id === event.target.value)
                  if (next) open(next, 'en-vivo')
                }}
              >
                {rows
                  .filter((row) => row.status === 'open')
                  .map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <div
            className={`${styles.detailHeader} rounded-card border p-5 md:p-7`}
            data-status={selected.status}
          >
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
            <nav className={styles.tabs} aria-label="Secciones de la dinámica">
              {(Object.keys(tabLabels) as DetailTab[]).map((item) => {
                const TabIcon = tabIcons[item]
                return (
                  <button
                    type="button"
                    key={item}
                    aria-current={tab === item ? 'page' : undefined}
                    data-kind={item}
                    onClick={() => chooseTab(item, selected)}
                    className={styles.tab}
                  >
                    <TabIcon aria-hidden className="size-4 shrink-0" />
                    {tabLabels[item]}
                  </button>
                )
              })}
            </nav>
          </div>

          <section
            className={
              tab === 'en-vivo' && scanning
                ? `hidden md:flex ${styles.sectionIntro}`
                : styles.sectionIntro
            }
            data-kind={tab}
          >
            <div className="flex min-w-0 items-start gap-3">
              {tab === 'preparar' ? (
                <ClipboardCheck aria-hidden className="mt-0.5 size-5 shrink-0" />
              ) : tab === 'en-vivo' ? (
                <Play aria-hidden className="mt-0.5 size-5 shrink-0" />
              ) : (
                <Trophy aria-hidden className="mt-0.5 size-5 shrink-0" />
              )}
              <div>
                <h4 className="m-0 font-black">
                  {tab === 'preparar'
                    ? selectedNeedsRules
                      ? 'Falta definir cómo se completa este reto'
                      : 'Todo listo para preparar'
                    : tab === 'en-vivo'
                      ? selected.status === 'draft'
                        ? 'Primero debes activar la dinámica'
                        : 'Zona de ejecución'
                      : 'Resultados y seguimiento'}
                </h4>
                <p className="m-0 mt-1 text-sm text-neo-text-secondary">
                  {tab === 'preparar'
                    ? selectedNeedsRules
                      ? 'Explica qué tiene que lograr el corredor antes de activar el reto.'
                      : 'Revisa las reglas, el acceso y los datos antes de activar.'
                    : tab === 'en-vivo'
                      ? selected.type === 'raffle'
                        ? 'Controla la cuenta atrás y revela a cada ganador desde aquí.'
                        : 'Cuando alguien termine, escanea su pase para registrar la participación.'
                      : selected.type === 'raffle'
                        ? 'Consulta los ganadores después del sorteo.'
                        : 'Revisa las participaciones completadas. No hay clasificación automática por tiempo.'}
                </p>
              </div>
            </div>
            {tab === 'preparar' && selectedNeedsRules && (
              <button
                className="button button-secondary shrink-0"
                type="button"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings2 aria-hidden className="size-4" /> Completar reglas
              </button>
            )}
            {tab === 'en-vivo' && selected.status === 'draft' && (
              <button
                className="button button-secondary shrink-0"
                type="button"
                onClick={() => chooseTab('preparar', selected)}
              >
                Ir a preparación
              </button>
            )}
          </section>

          {tab === 'preparar' && (
            <div className="flex flex-col gap-4">
              {settingsOpen ? (
                <DynamicForm
                  key={selected.id}
                  row={editor?.id === selected.id ? editor : selected}
                  brands={sponsors.data}
                  logos={sponsorLogos.data}
                  dynamics={rows}
                  onSave={save}
                  onCancel={() => setSettingsOpen(false)}
                />
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      ['Participaciones', String(selected.participations_count ?? 0)],
                      [
                        selected.type === 'raffle' ? 'Ganadores' : 'Completados',
                        String(
                          selected.type === 'raffle'
                            ? (selected.winners_count ?? 0)
                            : (selected.participations_count ?? 0),
                        ),
                      ],
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
                        <div className="max-w-lg">
                          <p className="m-0 font-bold">
                            {selectedNeedsRules
                              ? 'Termina la configuración primero'
                              : 'Lista para activar'}
                          </p>
                          <p className="m-0 mt-1 text-xs text-neo-text-secondary">
                            {selectedNeedsRules
                              ? 'Especifica el objetivo y el criterio de finalización. Luego podrás activar el reto.'
                              : 'Al activar, el personal podrá registrar participantes. Revisa las reglas antes.'}
                          </p>
                        </div>
                        {selectedNeedsRules ? (
                          <button
                            type="button"
                            className="button"
                            onClick={() => setSettingsOpen(true)}
                          >
                            <Settings2 aria-hidden className="size-4" /> Configurar reto
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="button"
                            disabled={busy}
                            onClick={() => void dynamics.activate(selected)}
                          >
                            <Play aria-hidden className="size-4" /> Activar dinámica
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="m-0 text-sm text-neo-text-secondary">
                          {selected.status === 'open'
                            ? 'La dinámica está activa. Dirígela desde «En vivo».'
                            : 'Esta dinámica ya tiene un estado registrado.'}
                        </p>
                        {selected.status === 'open' && (
                          <button
                            className="button"
                            type="button"
                            onClick={() => chooseTab('en-vivo', selected)}
                          >
                            <Play aria-hidden className="size-4" /> PLAY · En vivo
                          </button>
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setSettingsOpen(true)}
                    >
                      <Settings2 aria-hidden className="size-4" /> Editar ajustes
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
              {mechanicKind(selected) && (
                <MechanicsPanel key={selected.id} dynamic={selected} onUpdated={dynamics.reload} />
              )}
              {!mechanicKind(selected) && (
                <div className={selected.type === 'raffle' ? '' : 'hidden md:block'}>
                  <GameControlPanel
                    key={selected.id}
                    dynamic={selected}
                    onDraw={() => void dynamics.askDraw(selected)}
                    onPreview={(rehearsal) => setPreview({ id: selected.id, rehearsal })}
                  />
                </div>
              )}
              {!mechanicKind(selected) &&
                selected.type !== 'raffle' &&
                selected.status === 'open' && (
                  <div className={styles.scanPanel}>
                    <div>
                      <h4 className="m-0 text-lg font-black">
                        {selected.type === 'challenge'
                          ? 'Validar reto completado'
                          : 'Registrar participación'}
                      </h4>
                      <p className="m-0 mt-1 max-w-lg text-sm text-neo-text-secondary">
                        {selected.type === 'challenge'
                          ? 'Cuando el personal confirme que el corredor completó el reto, escanea su pase. Un registro por corredor.'
                          : 'Escanea el QR del corredor para registrar su participación.'}
                      </p>
                    </div>
                    {!scanning ? (
                      <button type="button" className="button" onClick={() => setScanning(true)}>
                        <Play aria-hidden className="size-4" /> PLAY · Abrir escáner
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
              {mechanicKind(selected) && (
                <MechanicsPanel
                  key={selected.id}
                  dynamic={selected}
                  resultsOnly
                  onUpdated={dynamics.reload}
                />
              )}
              {(selected.status === 'completed' || selected.status === 'closed') && (
                <button
                  type="button"
                  className="button button-secondary self-start"
                  onClick={() => repeat(selected)}
                >
                  <Copy aria-hidden className="size-4" /> Repetir dinámica
                </button>
              )}
              {selected.type !== 'raffle' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-card border border-neo-border bg-neo-surface p-5">
                    <p className="m-0 text-sm text-neo-text-secondary">
                      Participaciones registradas
                    </p>
                    <p className="m-0 mt-2 text-3xl font-black tabular-nums">
                      {selected.participations_count ?? 0}
                    </p>
                  </div>
                  <div className="rounded-card border border-neo-border bg-neo-surface p-5">
                    <p className="m-0 text-sm text-neo-text-secondary">Estado</p>
                    <p className="m-0 mt-2 font-black">{dynamicStates[selected.status]}</p>
                  </div>
                </div>
              )}
              {!mechanicKind(selected) &&
                (winners?.row.id === selected.id ? (
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
                      : selected.type !== 'raffle'
                        ? 'Los registros de finalización se contabilizan arriba. Esta versión no determina posiciones ni cronometra automáticamente.'
                        : 'Los resultados aparecerán aquí cuando termine la dinámica.'}
                  </p>
                ))}
            </>
          )}
        </>
      ) : (
        <>
          <MobileDynamicsHome
            rows={rows}
            logos={sponsorLogos.data}
            loading={loading}
            query={query}
            onQueryChange={setQuery}
            onOpen={open}
          />
          <div className="hidden flex-col gap-5 md:flex">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: 'Activas', count: counts.open, status: 'open' },
                { label: 'Borradores', count: counts.draft, status: 'draft' },
                { label: 'Completadas', count: counts.completed, status: 'completed' },
              ].map((item) => (
                <div key={item.status} data-status={item.status} className={styles.overviewStat}>
                  <p className="m-0 text-xs text-neo-text-secondary">{item.label}</p>
                  <p className="m-0 mt-1 text-2xl font-black tabular-nums sm:text-3xl">
                    {item.count}
                  </p>
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
                  className={`min-h-11 rounded-control border px-4 text-sm font-bold ${
                    category === item
                      ? 'border-neo-text bg-neo-text text-neo-surface'
                      : 'border-neo-border bg-neo-surface hover:bg-neo-muted-bg'
                  }`}
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
              <div className="flex flex-col gap-8">
                {grouped.map((group) => (
                  <section key={group.id} aria-label={group.title} className="flex flex-col gap-3">
                    <div className={styles.groupHeading}>
                      <div>
                        <h3 className="m-0 text-lg font-black">{group.title}</h3>
                        <p className="m-0 mt-1 text-xs text-neo-text-secondary">
                          {group.description}
                        </p>
                      </div>
                      <span className={styles.groupCount}>{group.rows.length}</span>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                      {group.rows.map((row) => (
                        <DynamicCard
                          key={row.id}
                          row={row}
                          onOpen={() => open(row)}
                          onRepeat={() => repeat(row)}
                          onPreview={() => setPreview({ id: row.id, rehearsal: false })}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : query ? (
              <NoMatches onClear={() => setQuery('')} />
            ) : (
              <EmptyState
                icon={Zap}
                title={`Sin ${categoryLabel(category).toLowerCase()}`}
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
          </div>
        </>
      )}
    </section>
  )
}
