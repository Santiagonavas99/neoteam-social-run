'use client'

import { ArrowLeft, LogIn } from 'lucide-react'
import Link from 'next/link'
import { type FormEvent, useState } from 'react'
import { BrandLink } from '@/components/brand-link'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import type { AdminResponse, FeedbackValue } from '../types'
import { Feedback } from '../ui/admin-ui'
import { LoadingState } from '../ui/loading-state'
import { isPin } from './pin'
import { PinField } from './pin-field'
import type { AdminSession } from './use-admin-session'
import { isUsername, normalizeUsername } from './username'

const USERNAME_RULE = 'El usuario usa de 3 a 32 letras minúsculas, números, punto o guion.'

export function UsernameField({
  label,
  value,
  onChange,
  autoFocus = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
}) {
  return (
    <label>
      {label}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={32}
        required
        autoFocus={autoFocus}
      />
    </label>
  )
}

export function AuthScreen({ session }: { session: AdminSession }) {
  const [setupSecret, setSetupSecret] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const message = error ?? session.bootError
  const feedback: FeedbackValue = message ? { kind: 'error', text: message } : null

  async function submit(
    event: FormEvent<HTMLFormElement>,
    validate: () => string,
    request: () => Promise<AdminResponse>,
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
      session.remember(data.token, data)
    } catch (caught) {
      setError(errorMessage(caught, fallback))
      setBusy(false)
    }
  }

  const setupPin = (event: FormEvent<HTMLFormElement>) =>
    submit(
      event,
      () =>
        name.trim().length < 2
          ? 'Escribe tu nombre.'
          : !isUsername(username)
            ? USERNAME_RULE
            : !isPin(pin)
              ? 'El PIN debe tener exactamente 6 dígitos.'
              : pin !== confirmPin
                ? 'Los dos PIN no coinciden.'
                : '',
      async () => {
        const data = await callAdmin('setup', {
          pin,
          setupSecret,
          name: name.trim(),
          username: normalizeUsername(username),
        })
        if (data.token) session.markConfigured()
        return data
      },
      'No pudimos configurar el acceso.',
    )

  const login = (event: FormEvent<HTMLFormElement>) =>
    submit(
      event,
      () =>
        !isUsername(username)
          ? 'Escribe tu usuario.'
          : isPin(pin)
            ? ''
            : 'Escribe tu PIN de 6 dígitos.',
      () => callAdmin('login', { username: normalizeUsername(username), pin }),
      'No pudimos iniciar sesión.',
    )

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 border-t-[6px] border-neo-accent-dark bg-neo-bg px-5 py-7 md:gap-8 md:py-10">
      <BrandLink />
      <section
        className="w-full max-w-[460px] rounded-card border border-neo-border bg-neo-surface px-6 py-7 md:p-10"
        aria-labelledby="login-title"
      >
        <p className="section-label">SOCIAL RUN · ADMIN</p>
        <h1 id="login-title" className="m-0 mb-4 text-[30px] tracking-[-0.05em] md:text-[34px]">
          Panel del evento
        </h1>
        {!session.ready ? (
          <LoadingState>Comprobando acceso…</LoadingState>
        ) : session.configured === false ? (
          <>
            <p className="m-0 text-sm text-neo-text-secondary">
              Primer acceso. Usa tu clave de configuración y crea tu usuario de administrador.
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
              <label>
                2. Tu nombre
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  maxLength={80}
                  required
                />
              </label>
              <UsernameField label="3. Elige tu usuario" value={username} onChange={setUsername} />
              <PinField label="4. Crea tu PIN" value={pin} onChange={setPin} />
              <PinField label="5. Confirma tu PIN" value={confirmPin} onChange={setConfirmPin} />
              <Feedback value={feedback} />
              <button
                type="submit"
                className="button full-width"
                disabled={
                  busy ||
                  session.setupSecretReady === false ||
                  !setupSecret ||
                  !isUsername(username) ||
                  !isPin(pin) ||
                  !isPin(confirmPin)
                }
              >
                <LogIn aria-hidden className="size-4 shrink-0" />
                {busy ? 'Configurando…' : 'Crear acceso y entrar'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="m-0 text-sm text-neo-text-secondary">
              Entra con tu usuario y tu PIN de 6 dígitos.
            </p>
            <form onSubmit={login} className="stack-form">
              <UsernameField label="Usuario" value={username} onChange={setUsername} autoFocus />
              <PinField label="PIN de acceso" value={pin} onChange={setPin} current />
              <Feedback value={feedback} />
              <button
                type="submit"
                className="button full-width"
                disabled={busy || !isUsername(username) || !isPin(pin)}
              >
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
