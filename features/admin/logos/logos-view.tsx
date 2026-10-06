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
import { LogoForm } from './logo-form'

export function LogosView({ token }: { token: string }) {
  const [editor, setEditor] = useState<LogoItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const fail = useCallback(
    (error: unknown, fallback: string) =>
      setFeedback({ kind: 'error', text: errorMessage(error, fallback) }),
    [],
  )
  const onLoadError = useCallback(
    (error: unknown) => fail(error, 'No pudimos cargar los logos.'),
    [fail],
  )
  const load = useCallback(
    async () => (await callLogos<LogoItem>('list', { token })).rows ?? [],
    [token],
  )
  const { data: rows, loading, reload } = useAdminData(load, [], onLoadError)

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
    })
  }

  async function save(values: LogoItem) {
    setBusy(true)
    setFeedback(null)
    try {
      await callLogos('save', {
        token,
        values: {
          name: values.name,
          logo_url: values.logo_url,
          link_url: values.link_url || null,
          active: values.active,
          sort_order: values.sort_order,
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
      await callLogos('delete', { token, id: row.id })
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
      token={token}
      busy={busy}
      onSave={save}
      onCancel={() => setEditor(null)}
    />
  )

  return (
    <section className="management-view" aria-busy={loading}>
      <div className="section-toolbar">
        <div>
          <h2>Logos de la cinta</h2>
          <p className="muted">
            Sube cada logo una sola vez. La web duplica la lista automáticamente para crear el
            movimiento infinito.
          </p>
        </div>
        <div className="toolbar-actions">
          <RefreshButton
            loading={loading}
            disabled={loading || busy || !!editor}
            onClick={() => void reload()}
          />
          <button type="button" className="button" onClick={addLogo} disabled={busy || !!editor}>
            <Plus aria-hidden className="size-4 shrink-0" />
            Añadir logo
          </button>
        </div>
      </div>

      <Feedback value={feedback} />

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
            const locked = busy || (!!editor && editor.id !== row.id)
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
