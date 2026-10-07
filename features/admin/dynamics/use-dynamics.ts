import { useCallback, useState } from 'react'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import { type DynamicRow, type FeedbackValue, isNew, type ScannedParticipant } from '../types'
import { useAdminData } from '../ui/use-admin-data'

export type DynamicConfirmation =
  | { row: DynamicRow; action: 'delete' | 'draw' }
  | { drafts: DynamicRow[]; action: 'deleteDrafts' }

const draftsDeleted = (count: number) =>
  count === 1 ? '1 borrador eliminado.' : `${count} borradores eliminados.`

export function useDynamics() {
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const [busy, setBusy] = useState(false)
  const [editor, setEditor] = useState<DynamicRow | null>(null)
  const [confirmation, setConfirmation] = useState<DynamicConfirmation | null>(null)
  const [eligible, setEligible] = useState<number | null>(null)
  const [winners, setWinners] = useState<{ name: string; list: ScannedParticipant[] } | null>(null)
  const onError = useCallback(
    (error: unknown) => setFeedback({ kind: 'error', text: errorMessage(error) }),
    [],
  )
  const load = useCallback(
    async () => (await callAdmin('dynamicData', { operation: 'list' })).dynamicRows ?? [],
    [],
  )
  const { data: rows, loading, reload } = useAdminData(load, [], onError)

  function edit(row: DynamicRow | null) {
    setFeedback(null)
    setWinners(null)
    setEditor(row)
  }

  async function save(row: DynamicRow) {
    const { id: _id, ...created } = row
    await callAdmin('dynamicData', { operation: 'save', values: isNew(row) ? created : row })
    setEditor(null)
    setFeedback({ kind: 'success', text: 'Dinámica guardada.' })
    await reload()
  }

  async function askDraw(row: DynamicRow) {
    setFeedback(null)
    setWinners(null)
    setEligible(null)
    setConfirmation({ row, action: 'draw' })
    try {
      setEligible(
        (await callAdmin('dynamicData', { operation: 'eligibleCount', id: row.id })).count ?? 0,
      )
    } catch (error) {
      setConfirmation(null)
      onError(error)
    }
  }

  async function activate(row: DynamicRow) {
    setBusy(true)
    setFeedback(null)
    setWinners(null)
    try {
      await callAdmin('dynamicData', { operation: 'save', values: { ...row, status: 'open' } })
      setFeedback({ kind: 'success', text: 'Dinámica activada.' })
      await reload()
    } catch (error) {
      onError(error)
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    if (!confirmation) return
    setBusy(true)
    setFeedback(null)
    try {
      if (confirmation.action === 'deleteDrafts') {
        const result = await callAdmin('dynamicData', { operation: 'deleteDrafts' })
        setFeedback({ kind: 'success', text: draftsDeleted(result.deleted ?? 0) })
      } else {
        const { row, action } = confirmation
        const result = await callAdmin('dynamicData', { operation: action, id: row.id })
        if (action === 'draw') setWinners({ name: row.name, list: result.winnerDetails ?? [] })
        else setFeedback({ kind: 'success', text: 'Dinámica eliminada.' })
      }
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
    activate,
    askDraw,
    eligible,
    confirm,
    onError,
  }
}
