'use client'

import { ArrowDown, ArrowUp, Eye, EyeOff, LockKeyhole, Save } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  type HomeSectionOrder,
  homeSectionMeta,
  normalizeHomeSectionOrder,
} from '@/features/home/section-order'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import type { FeedbackValue } from '../types'
import { Feedback } from '../ui/admin-ui'
import { LoadingState } from '../ui/loading-state'
import { RefreshButton } from '../ui/refresh-button'
import { useAdminData } from '../ui/use-admin-data'

export function HomeOrderView() {
  const [draft, setDraft] = useState<HomeSectionOrder[]>([])
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)

  const onLoadError = useCallback(
    (error: unknown) =>
      setFeedback({
        kind: 'error',
        text: errorMessage(error, 'No pudimos cargar la configuración de la Home.'),
      }),
    [],
  )
  const load = useCallback(async () => {
    const response = await callAdmin<HomeSectionOrder>('listHomeSections')
    return normalizeHomeSectionOrder(response.rows ?? [])
  }, [])
  const { data: rows, loading, reload } = useAdminData(load, [], onLoadError)

  useEffect(() => {
    setDraft(rows)
  }, [rows])

  function moveSection(index: number, direction: -1 | 1) {
    setFeedback(null)
    setDraft((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current

      const next = [...current]
      const [moved] = next.splice(index, 1)
      if (!moved) return current
      next.splice(target, 0, moved)

      return next.map((row, position) => ({
        ...row,
        sort_order: position + 1,
      }))
    })
  }

  function toggleVisibility(sectionKey: HomeSectionOrder['section_key']) {
    setFeedback(null)
    setDraft((current) =>
      current.map((row) =>
        row.section_key === sectionKey ? { ...row, visible: !row.visible } : row,
      ),
    )
  }

  async function save() {
    setBusy(true)
    setFeedback(null)
    try {
      const sections = draft.map((row, position) => ({
        ...row,
        sort_order: position + 1,
      }))
      await callAdmin('saveHomeSections', { sections })
      setFeedback({
        kind: 'success',
        text: 'Cambios guardados. La Home puede tardar hasta un minuto en reflejarlos.',
      })
      await reload()
    } catch (error) {
      setFeedback({
        kind: 'error',
        text: errorMessage(error, 'No pudimos guardar la configuración de la Home.'),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-busy={loading || busy}>
      <div className="mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="m-0 mb-1 text-[21px] font-bold tracking-[-0.035em]">Orden de la página</h2>
          <p className="m-0 max-w-[62ch] text-sm text-neo-text-secondary">
            Sube o baja cada sección y oculta temporalmente las que no necesites. Al volver a
            mostrarlas conservan su posición.
          </p>
        </div>
        <div className="flex items-center gap-2 md:shrink-0">
          <RefreshButton
            loading={loading}
            disabled={loading || busy}
            onClick={() => void reload()}
          />
          <button
            type="button"
            className="button"
            onClick={() => void save()}
            disabled={loading || busy || !draft.length}
          >
            <Save aria-hidden className="size-4 shrink-0" />
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <Feedback value={feedback} />

      <div className="mb-4 grid gap-2 rounded-control border border-neo-border bg-neo-muted-bg p-4 text-sm md:grid-cols-2">
        <div className="flex items-center gap-2">
          <LockKeyhole aria-hidden className="size-4 shrink-0 text-neo-text-secondary" />
          <span>
            <strong>Hero</strong> · fijo y siempre visible
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LockKeyhole aria-hidden className="size-4 shrink-0 text-neo-text-secondary" />
          <span>
            <strong>Footer</strong> · fijo y siempre visible
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingState>Cargando configuración de la página…</LoadingState>
      ) : (
        <div className="grid gap-3">
          {draft.map((row, position) => {
            const meta = homeSectionMeta[row.section_key]
            const first = position === 0
            const last = position === draft.length - 1
            const VisibilityIcon = row.visible ? Eye : EyeOff

            return (
              <div
                key={row.section_key}
                className={`grid gap-3 rounded-control border border-neo-border bg-neo-surface p-4 transition md:grid-cols-[minmax(0,1fr)_auto] md:items-center ${
                  row.visible ? '' : 'opacity-60'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>{meta.label}</strong>
                    <span className="rounded-full bg-neo-muted-bg px-2 py-1 text-xs font-semibold text-neo-text-secondary">
                      {row.visible ? 'Visible' : 'Oculta'}
                    </span>
                  </div>
                  <p className="m-0 mt-1 text-sm text-neo-text-secondary">{meta.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-2 rounded-control border border-neo-border bg-neo-bg px-3 text-sm font-semibold text-neo-text transition hover:bg-neo-muted-bg"
                    aria-pressed={!row.visible}
                    onClick={() => toggleVisibility(row.section_key)}
                    disabled={busy}
                  >
                    <VisibilityIcon aria-hidden className="size-4" />
                    {row.visible ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <button
                    type="button"
                    className="grid size-11 place-items-center rounded-control border border-neo-border bg-neo-bg text-neo-text transition hover:bg-neo-muted-bg disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label={`Subir ${meta.label}`}
                    title="Subir"
                    disabled={busy || first}
                    onClick={() => moveSection(position, -1)}
                  >
                    <ArrowUp aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="grid size-11 place-items-center rounded-control border border-neo-border bg-neo-bg text-neo-text transition hover:bg-neo-muted-bg disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label={`Bajar ${meta.label}`}
                    title="Bajar"
                    disabled={busy || last}
                    onClick={() => moveSection(position, 1)}
                  >
                    <ArrowDown aria-hidden className="size-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
