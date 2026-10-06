'use client'

import { Dices, Gift, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { callAdmin } from '../api'
import { matchesQuery } from '../filter'
import { raffleStates } from '../labels'
import type { CommunityRecord, Raffle } from '../types'
import { Feedback, StatusBadge } from '../ui/admin-ui'
import { ConfirmPanel } from '../ui/confirm-panel'
import { EmptyState, NoMatches } from '../ui/empty-state'
import { ListToolbar } from '../ui/list-toolbar'
import { LoadingState } from '../ui/loading-state'
import { EditButton, RecordCard } from '../ui/record-card'
import { useAdminData } from '../ui/use-admin-data'
import { useRecords } from '../use-records'
import { RaffleForm } from './raffle-form'

export function RafflesView({ token }: { token: string }) {
  const records = useRecords<Raffle>('raffles', token)
  const { rows, busy, feedback, editor, confirmation } = records
  const loadBrands = useCallback(
    async () =>
      (
        await callAdmin<CommunityRecord>('adminData', {
          token,
          resource: 'brands',
          operation: 'list',
        })
      ).rows ?? [],
    [token],
  )
  const sponsors = useAdminData<CommunityRecord[]>(loadBrands, [], records.onError)
  const brands = sponsors.data
  const loading = records.loading || sponsors.loading
  const [query, setQuery] = useState('')

  function addRecord() {
    records.edit({
      id: `new-${Date.now()}`,
      name: '',
      prize: '',
      description: '',
      winner_count: 1,
      requires_checkin: true,
      status: 'draft',
    })
  }

  const visible = rows.filter((row) => matchesQuery([row.name], query))

  return (
    <section className="management-view" aria-busy={loading}>
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
          void sponsors.reload()
        }}
        action={
          <button
            type="button"
            className="button"
            onClick={addRecord}
            disabled={!!editor || !!busy}
          >
            <Plus aria-hidden className="size-4 shrink-0" />
            Crear rifa
          </button>
        }
      />
      <Feedback value={feedback} />
      {confirmation &&
        (confirmation.action === 'draw' ? (
          <ConfirmPanel
            kind="draw"
            title="¿Todo listo para el sorteo?"
            text={`Se sortearán ${confirmation.row.winner_count} ganadores para “${confirmation.row.name}”. ${confirmation.row.requires_checkin ? 'Participan quienes hayan hecho check-in.' : 'Participan los inscritos elegibles.'} Los resultados se guardarán al confirmar.`}
            confirmLabel="Confirmar y sortear"
            busy={!!busy}
            onCancel={() => records.setConfirmation(null)}
            onConfirm={() => void records.confirm()}
          />
        ) : (
          <ConfirmPanel
            kind="delete"
            title={`¿Eliminar ${confirmation.row.name}?`}
            text="Se eliminará este registro. Puedes cancelar y conservarlo."
            confirmLabel="Sí, eliminar"
            busy={!!busy}
            onCancel={() => records.setConfirmation(null)}
            onConfirm={() => void records.confirm()}
          />
        ))}
      {editor?.id.startsWith('new-') && (
        <RaffleForm
          key={editor.id}
          row={editor}
          brands={brands}
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
            icon={Gift}
            title="Todo listo para empezar"
            text="Añade tu primera rifa para preparar el evento."
            action={
              !editor && (
                <button type="button" className="button" onClick={addRecord}>
                  <Plus aria-hidden className="size-4 shrink-0" />
                  Crear rifa
                </button>
              )
            }
          />
        )
      ) : (
        <div className="record-list">
          {visible.map((row) => (
            <RecordCard
              key={row.id}
              title={row.name}
              subtitle={row.prize}
              meta={
                <>
                  <StatusBadge
                    status={row.status ?? 'draft'}
                    label={raffleStates[row.status ?? 'draft'] ?? row.status ?? 'Borrador'}
                  />
                  <small>
                    {row.winner_count} ganador{row.winner_count === 1 ? '' : 'es'} ·{' '}
                    {row.requires_checkin ? 'Con check-in' : 'Sin check-in obligatorio'}
                  </small>
                  <small>
                    {brands.find((brand) => brand.id === row.sponsor_brand_id)?.name ||
                      'Sin patrocinador'}
                  </small>
                </>
              }
              actions={
                <>
                  <EditButton
                    open={editor?.id === row.id}
                    onClick={() => records.edit(editor?.id === row.id ? null : row)}
                    disabled={!!busy || (!!editor && editor.id !== row.id)}
                  />
                  {row.status === 'open' && (
                    <button
                      type="button"
                      className="button"
                      onClick={() => records.setConfirmation({ row, action: 'draw' })}
                      disabled={!!busy || !!editor}
                    >
                      <Dices aria-hidden className="size-4 shrink-0" />
                      Sortear
                    </button>
                  )}
                </>
              }
            >
              {editor?.id === row.id && (
                <RaffleForm
                  row={editor}
                  brands={brands}
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
