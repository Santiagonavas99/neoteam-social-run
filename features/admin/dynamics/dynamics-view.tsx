'use client'

import { Dices, Plus, ScanLine, Trash2, Zap } from 'lucide-react'
import { useCallback, useState } from 'react'
import { callAdmin } from '../api'
import { matchesQuery } from '../filter'
import { dynamicStates, dynamicTypes } from '../labels'
import type { CommunityRecord } from '../types'
import { Feedback, StatusBadge } from '../ui/admin-ui'
import { ConfirmPanel } from '../ui/confirm-panel'
import { EmptyState, NoMatches } from '../ui/empty-state'
import { LabelOptions } from '../ui/label-options'
import { ListToolbar } from '../ui/list-toolbar'
import { LoadingState } from '../ui/loading-state'
import { EditButton, RecordCard } from '../ui/record-card'
import { useAdminData } from '../ui/use-admin-data'
import { DrawResult } from './draw-result'
import { DynamicForm } from './dynamic-form'
import { ParticipationPanel } from './participation-panel'
import { useDynamics } from './use-dynamics'

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

export function DynamicsView({ token }: { token: string }) {
  const dynamics = useDynamics(token)
  const { rows, busy, feedback, editor, confirmation, winners } = dynamics
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
  const sponsors = useAdminData<CommunityRecord[]>(loadBrands, [], dynamics.onError)
  const brands = sponsors.data
  const loading = dynamics.loading || sponsors.loading
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [scanning, setScanning] = useState<string | null>(null)
  const locked = busy || !!editor || !!scanning
  const drafts = rows.filter((row) => row.status === 'draft')

  function addDynamic() {
    dynamics.edit({
      id: `new-${Date.now()}`,
      name: '',
      description: '',
      type: 'qr',
      status: 'draft',
      points: 10,
      requires_checkin: true,
      prize: '',
      winner_count: 1,
      config: { win_probability: 0.1 },
    })
  }

  function closeScanner() {
    setScanning(null)
    void dynamics.reload()
  }

  const visible = rows.filter(
    (row) =>
      (!type || row.type === type) &&
      matchesQuery([row.name, row.description, row.prize, dynamicTypes[row.type]], query),
  )

  const createButton = (
    <button type="button" className="button" onClick={addDynamic} disabled={locked}>
      <Plus aria-hidden className="size-4 shrink-0" />
      Crear dinámica
    </button>
  )

  return (
    <section aria-busy={loading}>
      <ListToolbar
        searchLabel="Buscar dinámicas"
        placeholder="Buscar dinámica…"
        query={query}
        onQuery={setQuery}
        filters={
          <label>
            <span className="sr-only">Filtrar por tipo</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Todos los tipos</option>
              <LabelOptions labels={dynamicTypes} />
            </select>
          </label>
        }
        loading={loading}
        refreshDisabled={loading || locked}
        onRefresh={() => {
          dynamics.setFeedback(null)
          void dynamics.reload()
          void sponsors.reload()
        }}
        action={createButton}
      />
      <Feedback value={feedback} />
      {winners && (
        <DrawResult
          name={winners.name}
          winners={winners.list}
          onClose={() => dynamics.setWinners(null)}
        />
      )}
      {confirmation?.action === 'draw' && (
        <ConfirmPanel
          kind="draw"
          title="¿Todo listo para el sorteo?"
          text={`Se sortearán ${plural(confirmation.row.winner_count, 'ganador', 'ganadores')} para “${confirmation.row.name}”. ${confirmation.row.eligibility_dynamic_id ? 'Participan quienes completaron la dinámica vinculada.' : confirmation.row.requires_checkin ? 'Participan quienes hayan hecho check-in.' : 'Participan los inscritos elegibles.'} Los resultados se guardarán al confirmar.`}
          confirmLabel="Confirmar y sortear"
          busy={busy}
          onCancel={() => dynamics.setConfirmation(null)}
          onConfirm={() => void dynamics.confirm()}
        />
      )}
      {confirmation?.action === 'delete' && (
        <ConfirmPanel
          kind="delete"
          title={`¿Eliminar ${confirmation.row.name}?`}
          text="Se eliminará la dinámica y todas sus participaciones."
          confirmLabel="Sí, eliminar"
          busy={busy}
          onCancel={() => dynamics.setConfirmation(null)}
          onConfirm={() => void dynamics.confirm()}
        />
      )}
      {confirmation?.action === 'deleteDrafts' && (
        <ConfirmPanel
          kind="delete"
          title={`¿Eliminar ${plural(confirmation.drafts.length, 'borrador', 'borradores')}?`}
          text={`${confirmation.drafts.map((draft) => draft.name).join(', ')}. Se eliminarán junto con sus participaciones.`}
          confirmLabel="Sí, eliminar borradores"
          busy={busy}
          onCancel={() => dynamics.setConfirmation(null)}
          onConfirm={() => void dynamics.confirm()}
        />
      )}
      {editor?.id.startsWith('new-') && (
        <DynamicForm
          key={editor.id}
          row={editor}
          brands={brands}
          dynamics={rows}
          onSave={dynamics.save}
          onCancel={() => dynamics.setEditor(null)}
        />
      )}
      {loading && !scanning ? (
        <LoadingState>Cargando dinámicas…</LoadingState>
      ) : !visible.length ? (
        query || type ? (
          <NoMatches
            onClear={() => {
              setQuery('')
              setType('')
            }}
          />
        ) : (
          <EmptyState
            icon={Zap}
            title="Todo listo para empezar"
            text="Crea stands, retos, premios instantáneos y sorteos para el día del evento."
            action={!editor && createButton}
          />
        )
      ) : (
        <div className="grid gap-3">
          {visible.map((row) => (
            <RecordCard
              key={row.id}
              title={row.name}
              subtitle={`${dynamicTypes[row.type]}${row.prize ? ` · ${row.prize}` : ''}`}
              meta={
                <>
                  <StatusBadge status={row.status} label={dynamicStates[row.status]} />
                  <small>
                    {plural(row.participations_count ?? 0, 'participación', 'participaciones')}
                    {row.winners_count
                      ? ` · ${plural(row.winners_count, 'ganador', 'ganadores')}`
                      : ''}
                  </small>
                  <small>
                    {row.requires_checkin ? 'Con check-in' : 'Sin check-in obligatorio'}
                    {row.points ? ` · +${row.points} pts` : ''}
                  </small>
                </>
              }
              actions={
                <>
                  <EditButton
                    open={editor?.id === row.id}
                    onClick={() => dynamics.edit(editor?.id === row.id ? null : row)}
                    disabled={busy || !!scanning || (!!editor && editor.id !== row.id)}
                  />
                  {row.status === 'open' && row.type === 'raffle' && (
                    <button
                      type="button"
                      className="button"
                      onClick={() => dynamics.setConfirmation({ row, action: 'draw' })}
                      disabled={locked}
                    >
                      <Dices aria-hidden className="size-4 shrink-0" />
                      Sortear
                    </button>
                  )}
                  {row.status === 'open' && row.type !== 'raffle' && (
                    <button
                      type="button"
                      className="button"
                      aria-expanded={scanning === row.id}
                      onClick={() => (scanning === row.id ? closeScanner() : setScanning(row.id))}
                      disabled={busy || !!editor || (!!scanning && scanning !== row.id)}
                    >
                      <ScanLine aria-hidden className="size-4 shrink-0" />
                      Registrar participación
                    </button>
                  )}
                </>
              }
            >
              {editor?.id === row.id && (
                <DynamicForm
                  row={editor}
                  brands={brands}
                  dynamics={rows}
                  onSave={dynamics.save}
                  onCancel={() => dynamics.setEditor(null)}
                  onDelete={() => dynamics.setConfirmation({ row, action: 'delete' })}
                />
              )}
              {scanning === row.id && (
                <ParticipationPanel token={token} dynamic={row} onClose={closeScanner} />
              )}
            </RecordCard>
          ))}
        </div>
      )}
      {!loading && drafts.length > 0 && (
        <div className="mt-6 flex justify-center md:justify-start">
          <button
            type="button"
            className="text-link danger-text"
            onClick={() => dynamics.setConfirmation({ action: 'deleteDrafts', drafts })}
            disabled={locked || !!confirmation}
          >
            <Trash2 aria-hidden className="size-4 shrink-0" />
            Eliminar borradores ({drafts.length})
          </button>
        </div>
      )}
    </section>
  )
}
