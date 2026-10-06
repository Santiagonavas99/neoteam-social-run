import { useCallback, useState } from 'react'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import { type DynamicRow, type FeedbackValue, isNew, type ScannedParticipant } from '../types'
import { useAdminData } from '../ui/use-admin-data'

export type DynamicConfirmation = { row: DynamicRow; action: 'delete' | 'draw' }

export function useDynamics(token: string) {
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const [busy, setBusy] = useState(false)
  const [editor, setEditor] = useState<DynamicRow | null>(null)
  const [confirmation, setConfirmation] = useState<DynamicConfirmation | null>(null)
  const [winners, setWinners] = useState<{ name: string; list: ScannedParticipant[] } | null>(null)
  const onError = useCallback(
    (error: unknown) => setFeedback({ kind: 'error', text: errorMessage(error) }),
    [],
  )
  const load = useCallback(
    async () => (await callAdmin('dynamicData', { token, operation: 'list' })).dynamicRows ?? [],
    [token],
  )
  const { data: rows, loading, reload } = useAdminData(load, [], onError)

  function edit(row: DynamicRow | null) {
    setFeedback(null)
    setWinners(null)
    setEditor(row)
  }

  async function save(row: DynamicRow) {
    const { id: _id, ...created } = row
    await callAdmin('dynamicData', { token, operation: 'save', values: isNew(row) ? created : row })
    setEditor(null)
    setFeedback({ kind: 'success', text: 'Dinámica guardada.' })
    await reload()
  }

  async function confirm() {
    if (!confirmation) return
    const { row, action } = confirmation
    setBusy(true)
    setFeedback(null)
    try {
      const result = await callAdmin('dynamicData', { token, operation: action, id: row.id })
      if (action === 'draw') setWinners({ name: row.name, list: result.winnerDetails ?? [] })
      else setFeedback({ kind: 'success', text: 'Dinámica eliminada.' })
      setConfirmation(null)
      setEditor(null)
      await reload()
    } catch (error) {
      onError(error)
    } finally {
      setBusy(false)
    }
  }

  return {
    rows,
    loading,
    reload,
    feedback,
    setFeedback,
    busy,
    editor,
    setEditor,
    edit,
    confirmation,
    setConfirmation,
    winners,
    setWinners,
    save,
    confirm,
    onError,
  }
}
