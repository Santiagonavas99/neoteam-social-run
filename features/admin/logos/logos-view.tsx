'use client'

import { Eye, EyeOff, ImagePlus, Link as LinkIcon, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { callLogos } from '../api'
import { errorMessage } from '../errors'
import { type FeedbackValue, isNew, type LogoItem } from '../types'
import { Feedback, Logo, StatusBadge } from '../ui/admin-ui'
import { EmptyState } from '../ui/empty-state'
import { LoadingState } from '../ui/loading-state'
import { EditButton, RecordCard } from '../ui/record-card'
import { RefreshButton } from '../ui/refresh-button'
import { useAdminData } from '../ui/use-admin-data'
import {
  type ExistingImageCandidate,
  listExistingImageCandidates,
  type MigrationProgress,
  migrateExistingImages,
} from './existing-image-migration'
import { LogoForm } from './logo-form'
import { canOfferLegacyWebpMigration } from './migration-guards'

export function LogosView({
  enableLegacyWebpMigration,
  kind = 'brand',
}: {
  enableLegacyWebpMigration: boolean
  kind?: 'brand' | 'race'
}) {
  const raceMode = kind === 'race'
  const [raceApiReady, setRaceApiReady] = useState(false)
  const canEdit = !raceMode || raceApiReady
  const [editor, setEditor] = useState<LogoItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [migrationCount, setMigrationCount] = useState<number | null>(null)
  const [previewingMigration, setPreviewingMigration] = useState(false)
  const [pendingMigration, setPendingMigration] = useState<ExistingImageCandidate[] | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null)
  const migrationLocked = previewingMigration || migrating || pendingMigration !== null
  const showMigrationButton =
    !raceMode &&
    canOfferLegacyWebpMigration(enableLegacyWebpMigration, migrationCount) &&
    pendingMigration === null &&
    !migrating
  const fail = useCallback(
    (error: unknown, fallback: string) =>
      setFeedback({ kind: 'error', text: errorMessage(error, fallback) }),
    [],
  )
  const onLoadError = useCallback(
    (error: unknown) => fail(error, 'No pudimos cargar los logos.'),
    [fail],
  )
  const load = useCallback(async () => {
    const response = await callLogos<LogoItem>('list', { carousel_kind: kind })
    // Older deployed edge functions ignore carousel_kind; fail closed rather than
    // accidentally allowing race editors to modify the brands carousel.
    if (raceMode && response.carousel_kind !== 'race') {
      setRaceApiReady(false)
      throw new Error('Actualiza la función admin-logos para gestionar Carreras aliadas.')
    }
    if (raceMode) setRaceApiReady(true)
    return response.rows ?? []
  }, [kind, raceMode])
  const { data: rows, loading, reload } = useAdminData(load, [], onLoadError)

  useEffect(() => {
    if (!enableLegacyWebpMigration || raceMode) return
    let active = true
    void listExistingImageCandidates()
      .then((candidates) => {
        if (active) setMigrationCount(candidates.length)
      })
      .catch((error: unknown) => {
        if (active) fail(error, 'No pudimos comprobar las imágenes pendientes.')
      })
    return () => {
      active = false
    }
  }, [enableLegacyWebpMigration, fail, raceMode])

  async function previewExistingImages() {
    setPreviewingMigration(true)
    setFeedback(null)
    try {
      const candidates = await listExistingImageCandidates()
      setMigrationCount(candidates.length)
      if (!candidates.length) {
        setFeedback({
          kind: 'success',
          text: 'Todos los logos guardados en Supabase ya están en WEBP.',
        })
        return
      }
      setPendingMigration(candidates)
    } catch (error) {
      fail(error, 'No pudimos revisar las imágenes existentes.')
    } finally {
      setPreviewingMigration(false)
    }
  }

  async function optimizeExistingImages() {
    if (!pendingMigration) return
    setMigrating(true)
    setFeedback(null)
    try {
      const summary = await migrateExistingImages(pendingMigration, setMigrationProgress)
      const remaining = await listExistingImageCandidates()
      setMigrationCount(remaining.length)
      const resultText = `Proceso terminado: ${summary.converted} convertidos, ${summary.skipped} omitidos y ${summary.failed.length} fallidos.`
      setFeedback({
        kind: remaining.length ? 'error' : 'success',
        text: remaining.length
          ? `${resultText} Quedan ${remaining.length} imágenes por optimizar. ${summary.failed.slice(0, 2).join(' · ')}`.trim()
          : `${resultText} Todos los logos están optimizados; esta opción ya no aparecerá.`,
      })
      await reload()
    } catch (error) {
      fail(error, 'La optimización no pudo completarse. Los archivos originales se conservan.')
    } finally {
      setMigrating(false)
      setPendingMigration(null)
      setMigrationProgress(null)
    }
  }

  function addLogo() {
    if (!canEdit) return
    setFeedback(null)
    setConfirmingId(null)
    setEditor({
      id: `new-${Date.now()}`,
      name: '',
      logo_url: '',
      link_url: '',
      active: true,
      sort_order: rows.length,
      show_in_running_crews: false,
      show_in_organizations: false,
    })
  }

  async function save(values: LogoItem) {
    if (!canEdit) return
    setBusy(true)
    setFeedback(null)
    try {
      await callLogos('save', {
        carousel_kind: kind,
        values: {
          name: values.name,
          logo_url: values.logo_url,
          link_url: values.link_url || null,
          active: values.active,
          sort_order: values.sort_order,
          show_in_running_crews: values.show_in_running_crews,
          show_in_organizations: values.show_in_organizations,
          ...(isNew(values) ? {} : { id: values.id }),
        },
      })
      setEditor(null)
      setFeedback({
        kind: 'success',
        text: raceMode
          ? 'Carrera guardada. Ya está configurada para su carrusel en la Home.'
          : 'Logo guardado. La cinta de la Home ya usa esta configuración.',
      })
      await reload()
    } catch (error) {
      fail(error, 'No pudimos guardar el logo.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(row: LogoItem) {
    if (!canEdit) return
    if (confirmingId !== row.id) {
      setConfirmingId(row.id)
      return
    }
    setBusy(true)
    setFeedback(null)
    try {
      await callLogos('delete', { id: row.id, carousel_kind: kind })
      setConfirmingId(null)
      if (editor?.id === row.id) setEditor(null)
      setFeedback({ kind: 'success', text: `${row.name} eliminado del carrusel.` })
      await reload()
    } catch (error) {
      fail(error, 'No pudimos eliminar el logo.')
    } finally {
      setBusy(false)
    }
  }

  const form = (row: LogoItem) => (
    <LogoForm
      key={row.id}
      row={row}
      busy={busy}
      kind={kind}
      onSave={save}
      onCancel={() => setEditor(null)}
    />
  )

  return (
    <section aria-busy={loading}>
      <div className="mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="m-0 mb-1 text-[21px] font-bold tracking-[-0.035em]">
            {raceMode ? 'Carreras aliadas' : 'Logos de marcas aliadas'}
          </h2>
          <p className="m-0 max-w-[60ch] text-sm text-neo-text-secondary">
            {raceMode
              ? 'Gestiona aquí las carreras aliadas, con su logo, enlace, posición y visibilidad. No se mezclan con las marcas.'
              : 'Sube cada logo una sola vez. La web duplica la lista automáticamente para crear el movimiento infinito.'}
          </p>
        </div>
        <div className="flex items-center gap-2 md:shrink-0 [&>.button]:flex-1 md:[&>.button]:flex-none">
          <RefreshButton
            loading={loading}
            disabled={loading || busy || !!editor || migrationLocked}
            onClick={() => void reload()}
          />
          {showMigrationButton && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => void previewExistingImages()}
              disabled={loading || busy || !!editor || migrationLocked}
            >
              {previewingMigration ? 'Buscando imágenes…' : 'Optimizar logos existentes'}
            </button>
          )}
          <button
            type="button"
            className="button"
            onClick={addLogo}
            disabled={!canEdit || busy || !!editor || migrationLocked}
          >
            <Plus aria-hidden className="size-4 shrink-0" />
            {raceMode ? 'Añadir carrera' : 'Añadir logo'}
          </button>
        </div>
      </div>

      <Feedback value={feedback} />

      {pendingMigration && !migrating && (
        <section
          aria-label="Confirmar conversión de imágenes"
          className="rounded-control border border-neo-border bg-neo-surface p-4 md:p-5"
        >
          <h3 className="m-0 mb-2 text-base font-bold">
            Convertir {pendingMigration.length} logos a WEBP
          </h3>
          <p className="m-0 mb-4 text-sm text-neo-text-secondary">
            Se optimizarán los logos de marcas, running crews y organizaciones que siguen en PNG o
            JPG. Se mantendrán los archivos originales y solo se cambiarán los enlaces después de
            subir cada WEBP correctamente. Cuando no queden logos pendientes, esta opción
            desaparecerá de forma permanente.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setPendingMigration(null)}
            >
              Cancelar
            </button>
            <button type="button" className="button" onClick={() => void optimizeExistingImages()}>
              Convertir imágenes existentes
            </button>
          </div>
        </section>
      )}

      {migrating && migrationProgress && (
        <p role="status" aria-live="polite" className="m-0 text-sm text-neo-text-secondary">
          Convirtiendo {migrationProgress.name} · {migrationProgress.index} de{' '}
          {migrationProgress.total}. Mantén esta pestaña abierta.
        </p>
      )}

      {editor && isNew(editor) && form(editor)}

      {loading ? (
        <LoadingState>Cargando logos…</LoadingState>
      ) : !rows.length ? (
        <EmptyState
          icon={ImagePlus}
          title={raceMode ? 'Añade carreras aliadas' : 'Añade los logos del carrusel'}
          text={
            raceMode
              ? 'Sube el logo de cada carrera. Su carrusel aparecerá en la Home cuando haya carreras visibles.'
              : 'Sube imágenes horizontales de marcas, aliados o patrocinadores. Se mostrarán en una cinta continua en la Home.'
          }
          action={
            !editor && (
              <button
                type="button"
                className="button"
                onClick={addLogo}
                disabled={!canEdit}
              >
                <Plus aria-hidden className="size-4 shrink-0" />
                {raceMode ? 'Añadir primera carrera' : 'Añadir primer logo'}
              </button>
            )
          }
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => {
            const locked = busy || migrationLocked || (!!editor && editor.id !== row.id)
            const confirming = confirmingId === row.id
            return (
              <RecordCard
                key={row.id}
                logo={<Logo url={row.logo_url} name={row.name} />}
                title={row.name}
                subtitle={`Posición ${row.sort_order}`}
                meta={
                  <>
                    <StatusBadge
                      status={row.active ? 'open' : 'cancelled'}
                      label={row.active ? 'Visible' : 'Oculto'}
                      icon={row.active ? Eye : EyeOff}
                    />
                    <small className="inline-flex items-center gap-1">
                      {row.link_url && <LinkIcon aria-hidden className="size-3.5 shrink-0" />}
                      {row.link_url || 'Sin enlace'}
                    </small>
                  </>
                }
                actions={
                  <>
                    <EditButton
                      open={editor?.id === row.id}
                      onClick={() => {
                        setConfirmingId(null)
                        setEditor(editor?.id === row.id ? null : row)
                      }}
                      disabled={locked}
                    />
                    <button
                      type="button"
                      className={confirming ? 'button button-danger' : 'text-link danger-text'}
                      onClick={() => void remove(row)}
                      disabled={locked}
                    >
                      <Trash2 aria-hidden className="size-4 shrink-0" />
                      {confirming ? 'Confirmar eliminar' : 'Eliminar'}
                    </button>
                  </>
                }
              >
                {editor?.id === row.id && form(editor)}
              </RecordCard>
            )
          })}
        </div>
      )}
    </section>
  )
}
