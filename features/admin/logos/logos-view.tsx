'use client'

import { Eye, EyeOff, ImagePlus, Link as LinkIcon, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
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

export function LogosView() {
  const [editor, setEditor] = useState<LogoItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [previewingMigration, setPreviewingMigration] = useState(false)
  const [pendingMigration, setPendingMigration] = useState<ExistingImageCandidate[] | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null)
  const migrationLocked = previewingMigration || migrating || pendingMigration !== null
  const fail = useCallback(
    (error: unknown, fallback: string) =>
      setFeedback({ kind: 'error', text: errorMessage(error, fallback) }),
    [],
  )
  const onLoadError = useCallback(
    (error: unknown) => fail(error, 'No pudimos cargar los logos.'),
    [fail],
  )
  const load = useCallback(async () => (await callLogos<LogoItem>('list')).rows ?? [], [])
  const { data: rows, loading, reload } = useAdminData(load, [], onLoadError)

  async function previewExistingImages() {
    setPreviewingMigration(true)
    setFeedback(null)
    try {
      const candidates = await listExistingImageCandidates()
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
      const resultText = `Proceso terminado: ${summary.converted} convertidos, ${summary.skipped} omitidos y ${summary.failed.length} fallidos.`
      setFeedback({
        kind: summary.failed.length || summary.skipped ? 'error' : 'success',
        text: summary.failed.length
          ? `${resultText} ${summary.failed.slice(0, 2).join(' · ')}`
          : resultText,
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
    setBusy(true)
    setFeedback(null)
    try {
      await callLogos('save', {
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
        text: 'Logo guardado. La cinta de la Home ya usa esta configuración.',
      })
      await reload()
    } catch (error) {
      fail(error, 'No pudimos guardar el logo.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(row: LogoItem) {
    if (confirmingId !== row.id) {
      setConfirmingId(row.id)
      return
    }
    setBusy(true)
    setFeedback(null)
    try {
      await callLogos('delete', { id: row.id })
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
    <LogoForm key={row.id} row={row} busy={busy} onSave={save} onCancel={() => setEditor(null)} />
  )

  return (
    <section aria-busy={loading}>
      <div className="mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="m-0 mb-1 text-[21px] font-bold tracking-[-0.035em]">Logos de la cinta</h2>
          <p className="m-0 max-w-[60ch] text-sm text-neo-text-secondary">
            Sube cada logo una sola vez. La web duplica la lista automáticamente para crear el
            movimiento infinito.
          </p>
        </div>
        <div className="flex items-center gap-2 md:shrink-0 [&>.button]:flex-1 md:[&>.button]:flex-none">
          <RefreshButton
            loading={loading}
            disabled={loading || busy || !!editor || migrationLocked}
            onClick={() => void reload()}
          />
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void previewExistingImages()}
            disabled={loading || busy || !!editor || migrationLocked}
          >
            {previewingMigration
              ? 'Buscando imágenes…'
              : migrating
                ? 'Optimizando…'
                : 'Optimizar logos existentes'}
          </button>
          <button
            type="button"
            className="button"
            onClick={addLogo}
            disabled={busy || !!editor || migrationLocked}
          >
            <Plus aria-hidden className="size-4 shrink-0" />
            Añadir logo
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
            subir cada WEBP correctamente. La base de datos puede ser la misma en Preview y
            Producción.
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
          title="Añade los logos del carrusel"
          text="Sube imágenes horizontales de marcas, aliados o patrocinadores. Se mostrarán en una cinta continua en la Home."
          action={
            !editor && (
              <button type="button" className="button" onClick={addLogo}>
                <Plus aria-hidden className="size-4 shrink-0" />
                Añadir primer logo
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
