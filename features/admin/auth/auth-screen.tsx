'use client'

import { ArrowLeft, LoaderCircle, LogIn } from 'lucide-react'
import Link from 'next/link'
import { type FormEvent, useState } from 'react'
import { BrandLink } from '@/components/brand-link'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import type { FeedbackValue } from '../types'
import { Feedback } from '../ui/admin-ui'
import { isPin } from './pin'
import { PinField } from './pin-field'
import type { AdminSession } from './use-admin-session'

export function AuthScreen({ session }: { session: AdminSession }) {
  const [setupSecret, setSetupSecret] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const message = error ?? session.bootError
  const feedback: FeedbackValue = message ? { kind: 'error', text: message } : null

  async function submit(
    event: FormEvent<HTMLFormElement>,
    validate: () => string,
    request: () => Promise<{ token?: string }>,
    fallback: string,
  ) {
    event.preventDefault()
    setError('')
    const invalid = validate()
    if (invalid) {
      setError(invalid)
      return
    }
    setBusy(true)
    try {
      const data = await request()
      if (!data.token) throw new Error('No pudimos crear la sesión administrativa.')
      session.remember(data.token)
    } catch (caught) {
      setError(errorMessage(caught, fallback))
      setBusy(false)
    }
  }

  const setupPin = (event: FormEvent<HTMLFormElement>) =>
    submit(
      event,
      () =>
        !isPin(pin)
          ? 'El PIN debe tener exactamente 6 dígitos.'
          : pin !== confirmPin
            ? 'Los dos PIN no coinciden.'
            : '',
      async () => {
        const data = await callAdmin('setup', { pin, setupSecret })
        if (data.token) session.markConfigured()
        return data
      },
      'No pudimos configurar el PIN.',
    )

  const login = (event: FormEvent<HTMLFormElement>) =>
    submit(
      event,
      () => (isPin(pin) ? '' : 'Escribe tu PIN de 6 dígitos.'),
      () => callAdmin('login', { pin }),
      'No pudimos iniciar sesión.',
    )

  return (
    <main className="admin-auth">
      <BrandLink />
      <section className="auth-card" aria-labelledby="login-title">
        <p className="section-label">SOCIAL RUN · ADMIN</p>
        <h1 id="login-title">Panel del evento</h1>
        {!session.ready ? (
          <p className="loading-state flex items-center gap-2" role="status">
            <LoaderCircle aria-hidden className="size-4 shrink-0 motion-safe:animate-spin" />
            Comprobando acceso…
          </p>
        ) : session.configured === false ? (
          <>
            <p className="muted">
              Primer acceso. Usa tu clave de configuración y elige el PIN con el que entrarás al
              panel.
            </p>
            {session.setupSecretReady === false && (
              <Feedback
                value={{
                  kind: 'error',
                  text: 'La configuración inicial aún no está disponible. Falta la clave privada en Supabase.',
                }}
              />
            )}
            <form onSubmit={setupPin} className="stack-form">
              <label>
                1. Clave de configuración
                <input
                  type="password"
                  value={setupSecret}
                  onChange={(e) => setSetupSecret(e.target.value)}
                  autoComplete="off"
                  required
                />
                <small>Solo se utiliza en este primer acceso.</small>
              </label>
              <PinField label="2. Crea tu PIN" value={pin} onChange={setPin} />
              <PinField label="3. Confirma tu PIN" value={confirmPin} onChange={setConfirmPin} />
              <Feedback value={feedback} />
              <button
                type="submit"
                className="button full-width"
                disabled={
                  busy ||
                  session.setupSecretReady === false ||
                  !setupSecret ||
                  !isPin(pin) ||
                  !isPin(confirmPin)
                }
              >
                <LogIn aria-hidden className="size-4 shrink-0" />
                {busy ? 'Configurando…' : 'Guardar PIN y entrar'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="muted">Introduce tu PIN de 6 dígitos para continuar.</p>
            <form onSubmit={login} className="stack-form">
              <PinField label="PIN de acceso" value={pin} onChange={setPin} current autoFocus />
              <Feedback value={feedback} />
              <button type="submit" className="button full-width" disabled={busy || !isPin(pin)}>
                <LogIn aria-hidden className="size-4 shrink-0" />
                {busy ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          </>
        )}
      </section>
      <Link href="/" className="text-link">
        <ArrowLeft aria-hidden className="size-4 shrink-0" />
        Volver al evento
      </Link>
    </main>
  )
}
