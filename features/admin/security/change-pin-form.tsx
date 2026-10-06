'use client'

import { KeyRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { callAdmin } from '../api'
import { isPin } from '../auth/pin'
import { PinField } from '../auth/pin-field'
import { errorMessage } from '../errors'
import type { FeedbackValue } from '../types'
import { Feedback } from '../ui/admin-ui'

export function ChangePinForm({
  token,
  onToken,
}: {
  token: string
  onToken: (token: string) => void
}) {
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmNewPin, setConfirmNewPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const fail = (text: string) => setFeedback({ kind: 'error', text })

  async function changePin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)
    if (!isPin(newPin)) return fail('El nuevo PIN debe tener exactamente 6 dígitos.')
    if (newPin !== confirmNewPin) return fail('Los dos PIN nuevos no coinciden.')
    if (!isPin(currentPin)) return fail('Escribe tu PIN actual de 6 dígitos.')

    setBusy(true)
    try {
      const data = await callAdmin('changePin', { token, currentPin, newPin })
      if (!data.token) throw new Error('El PIN cambió, pero no pudimos renovar la sesión.')
      onToken(data.token)
      setCurrentPin('')
      setNewPin('')
      setConfirmNewPin('')
      setFeedback({ kind: 'success', text: 'PIN actualizado. Las demás sesiones fueron cerradas.' })
    } catch (error) {
      fail(errorMessage(error, 'No pudimos actualizar el PIN.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-surface security-card">
      <h2 className="flex items-center gap-2">
        <KeyRound aria-hidden className="size-5 shrink-0" />
        Cambiar PIN
      </h2>
      <p className="muted">
        Al actualizarlo, se cerrarán las demás sesiones. Esta sesión seguirá activa.
      </p>
      <form onSubmit={changePin} className="stack-form">
        <PinField label="PIN actual" value={currentPin} onChange={setCurrentPin} current />
        <PinField label="Nuevo PIN" value={newPin} onChange={setNewPin} />
        <PinField label="Confirmar nuevo PIN" value={confirmNewPin} onChange={setConfirmNewPin} />
        <Feedback value={feedback} />
        <button
          type="submit"
          className="button"
          disabled={busy || !isPin(currentPin) || !isPin(newPin) || !isPin(confirmNewPin)}
        >
          <KeyRound aria-hidden className="size-4 shrink-0" />
          {busy ? 'Actualizando…' : 'Actualizar PIN'}
        </button>
      </form>
    </section>
  )
}
