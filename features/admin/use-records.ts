import { useCallback, useState } from 'react'
import { callAdmin } from './api'
import { errorMessage } from './errors'
import { type FeedbackValue, isNew, type Resource } from './types'
import { useAdminData } from './ui/use-admin-data'

export type Confirmation<Row> = { row: Row; action: 'delete' | 'draw' }

export function useRecords<Row extends { id: string }>(resource: Resource, token: string) {
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [editor, setEditor] = useState<Row | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation<Row> | null>(null)
  const onError = useCallback(
    (error: unknown) => setFeedback({ kind: 'error', text: errorMessage(error) }),
    [],
  )
  const load = useCallback(
    async () =>
      (await callAdmin<Row>('adminData', { token, resource, operation: 'list' })).rows ?? [],
    [token, resource],
  )
  const { data: rows, setData: setRows, loading, reload } = useAdminData(load, [], onError)

  function edit(row: Row | null) {
    setFeedback(null)
    setEditor(row)
  }

  async function save(row: Row) {
    const { id: _id, ...created } = row
    await callAdmin('adminData', {
      token,
      resource,
      operation: 'save',
      values: isNew(row) ? created : row,
    })
    setEditor(null)
    setFeedback({ kind: 'success', text: 'Cambios guardados.' })
    await reload()
  }

  async function confirm() {
    if (!confirmation) return
    setBusy(confirmation.row.id)
    setFeedback(null)
    try {
      const result = await callAdmin('adminData', {
        token,
        resource,
        operation: confirmation.action,
        id: confirmation.row.id,
      })
      setFeedback({
        kind: 'success',
        text:
          confirmation.action === 'draw'
            ? `Sorteo completado. ${result.winners ?? 'Los'} ganadores guardados.`
            : 'Registro eliminado.',
      })
      setConfirmation(null)
      setEditor(null)
      await reload()
    } catch (error) {
      onError(error)
    } finally {
      setBusy(null)
    }
  }

  return {
    rows,
    setRows,
    loading,
    reload,
    feedback,
    setFeedback,
    busy,
    setBusy,
    editor,
    setEditor,
    edit,
    confirmation,
    setConfirmation,
    save,
    confirm,
    onError,
  }
}
