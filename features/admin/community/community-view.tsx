'use client'

import { Eye, EyeOff, Flag, Plus, Tag } from 'lucide-react'
import { useState } from 'react'
import { matchesQuery } from '../filter'
import { brandTypes } from '../labels'
import type { CommunityRecord } from '../types'
import { Feedback, Logo, StatusBadge } from '../ui/admin-ui'
import { ConfirmPanel } from '../ui/confirm-panel'
import { EmptyState, NoMatches } from '../ui/empty-state'
import { ListToolbar } from '../ui/list-toolbar'
import { LoadingState } from '../ui/loading-state'
import { EditButton, RecordCard } from '../ui/record-card'
import { useRecords } from '../use-records'
import { CommunityForm } from './community-form'

export function CommunityView({ resource }: { resource: 'groups' | 'brands' }) {
  const records = useRecords<CommunityRecord>(resource)
  const { rows, loading, busy, feedback, editor, confirmation } = records
  const [query, setQuery] = useState('')
  const brand = resource === 'brands'
  const newLabel = brand ? 'Añadir marca' : 'Añadir running crew'

  function addRecord() {
    records.edit({
      id: `new-${Date.now()}`,
      name: '',
      slug: '',
      logo_url: '',
      instagram: '',
      active: true,
      show_on_home: true,
      sort_order: rows.length,
      type: 'sponsor',
      invited: false,
    })
  }

  const addButton = (
    <button type="button" className="button" onClick={addRecord} disabled={!!editor || !!busy}>
      <Plus aria-hidden className="size-4 shrink-0" />
      {newLabel}
    </button>
  )
  const visible = rows.filter((row) => matchesQuery([row.name], query))

  return (
    <section aria-busy={loading}>
      <ListToolbar
        searchLabel="Buscar registros"
        placeholder="Buscar por nombre…"
        query={query}
        onQuery={setQuery}
        loading={loading}
        refreshDisabled={loading || !!busy || !!editor}
        onRefresh={() => {
          records.setFeedback(null)
          void records.reload()
        }}
        action={addButton}
      />
      <Feedback value={feedback} />
      {confirmation && (
        <ConfirmPanel
          kind="delete"
          title={`¿Eliminar ${confirmation.row.name}?`}
          text="Se eliminará este registro. Puedes cancelar y conservarlo."
          confirmLabel="Sí, eliminar"
          busy={!!busy}
          onCancel={() => records.setConfirmation(null)}
          onConfirm={() => void records.confirm()}
        />
      )}
      {editor?.id.startsWith('new-') && (
        <CommunityForm
          key={editor.id}
          row={editor}
          resource={resource}
          onSave={records.save}
          onCancel={() => records.setEditor(null)}
        />
      )}
      {loading ? (
        <LoadingState>Cargando registros…</LoadingState>
      ) : !visible.length ? (
        query ? (
          <NoMatches onClear={() => setQuery('')} />
        ) : (
          <EmptyState
            icon={brand ? Tag : Flag}
            title="Todo listo para empezar"
            text={brand ? 'Añade una marca u organización para preparar el evento.' : 'Añade un running crew para preparar el evento.'}
            action={
              !editor && (
                <button type="button" className="button" onClick={addRecord}>
                  <Plus aria-hidden className="size-4 shrink-0" />
                  {newLabel}
                </button>
              )
            }
          />
        )
      ) : (
        <div className="grid gap-3">
          {visible.map((row) => (
            <RecordCard
              key={row.id}
              logo={<Logo url={row.logo_url} name={row.name || 'Sin nombre'} />}
              title={row.name}
              subtitle={
                brand
                  ? brandTypes[row.type ?? 'invited']
                  : row.invited
                    ? 'Running crew invitado'
                    : 'Running crew'
              }
              meta={
                <>
                  <StatusBadge
                    status={row.active ? 'open' : 'cancelled'}
                    label={row.active ? 'Activo' : 'Inactivo'}
                    icon={row.active ? Eye : EyeOff}
                  />
                  <small>{row.show_on_home ? 'Visible en web' : 'Oculto en web'}</small>
                  <small>{row.instagram || row.website || 'Sin redes añadidas'}</small>
                </>
              }
              actions={
                <EditButton
                  open={editor?.id === row.id}
                  onClick={() => records.edit(editor?.id === row.id ? null : row)}
                  disabled={!!busy || (!!editor && editor.id !== row.id)}
                />
              }
            >
              {editor?.id === row.id && (
                <CommunityForm
                  row={editor}
                  resource={resource}
                  onSave={records.save}
                  onCancel={() => records.setEditor(null)}
                  onDelete={() => records.setConfirmation({ row, action: 'delete' })}
                />
              )}
            </RecordCard>
          ))}
        </div>
      )}
    </section>
  )
}
