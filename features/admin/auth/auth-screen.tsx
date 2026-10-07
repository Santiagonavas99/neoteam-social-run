'use client'

import { ArrowLeft, ArrowRight, LogIn, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { type FormEvent, useEffect, useState } from 'react'
import { BrandLink } from '@/components/brand-link'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import type { FeedbackValue } from '../types'
import { Feedback } from '../ui/admin-ui'
import { LoadingState } from '../ui/loading-state'
import { isCode, isEmail, normalizeEmail } from './code'
import { CodeField } from './code-field'
import type { AdminSession } from './use-admin-session'

const RESEND_SECONDS = 60

export function AuthScreen({ session }: { session: AdminSession }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [wait, setWait] = useState(0)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const shown: FeedbackValue =
    feedback ?? (session.bootError ? { kind: 'error', text: session.bootError } : null)

  useEffect(() => {
    if (!wait) return
    const timer = window.setTimeout(() => setWait((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [wait])

  async function requestCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!isEmail(email)) {
      setFeedback({ kind: 'error', text: 'Escribe un correo válido.' })
      return
    }
    setBusy(true)
    setFeedback(null)
    try {
      await callAdmin('requestCode', { email: normalizeEmail(email) })
      setStep('code')
      setCode('')
      setWait(RESEND_SECONDS)
    } catch (caught) {
      setFeedback({ kind: 'error', text: errorMessage(caught, 'No pudimos enviar el código.') })
    } finally {
      setBusy(false)
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isCode(code)) {
      setFeedback({ kind: 'error', text: 'Escribe el código de 6 dígitos.' })
      return
    }
    setBusy(true)
    setFeedback(null)
    try {
      const data = await callAdmin('verifyCode', { email: normalizeEmail(email), code })
      if (!data.ok) throw new Error('No pudimos crear la sesión administrativa.')
      session.remember(data)
    } catch (caught) {
      setFeedback({ kind: 'error', text: errorMessage(caught, 'No pudimos iniciar sesión.') })
      setBusy(false)
    }
  }

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
        ) : step === 'email' ? (
          <>
            <p className="m-0 text-sm text-neo-text-secondary">
              Escribe tu correo y te enviaremos un código de 6 dígitos para entrar.
            </p>
            <form onSubmit={(event) => void requestCode(event)} className="stack-form">
              <label>
                Correo
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={160}
                  required
                  autoFocus
                />
              </label>
              <Feedback value={shown} />
              <button
                type="submit"
                className="button full-width"
                disabled={busy || !isEmail(email)}
              >
                {busy ? 'Enviando…' : 'Enviarme un código'}
                <ArrowRight aria-hidden className="size-4 shrink-0" />
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="m-0 text-sm text-neo-text-secondary">
              Si <strong className="text-neo-text">{normalizeEmail(email)}</strong> tiene acceso, te
              llegará un código en unos segundos. Revisa también la carpeta de spam.
            </p>
            <form onSubmit={(event) => void verifyCode(event)} className="stack-form">
              <CodeField label="Código" value={code} onChange={setCode} autoFocus />
              <Feedback value={shown} />
              <button type="submit" className="button full-width" disabled={busy || !isCode(code)}>
                <LogIn aria-hidden className="size-4 shrink-0" />
                {busy ? 'Entrando…' : 'Entrar'}
              </button>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  className="text-link min-h-11"
                  disabled={busy || wait > 0}
                  onClick={() => void requestCode()}
                >
                  <RefreshCw aria-hidden className="size-4 shrink-0" />
                  {wait > 0 ? `Reenviar código en ${wait} s` : 'Reenviar código'}
                </button>
                <button
                  type="button"
                  className="text-link min-h-11"
                  disabled={busy}
                  onClick={() => {
                    setStep('email')
                    setFeedback(null)
                  }}
                >
                  Usar otro correo
                </button>
              </div>
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
