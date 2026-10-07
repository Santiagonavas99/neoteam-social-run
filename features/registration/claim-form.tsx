'use client'

import { RefreshCw } from 'lucide-react'
import { useActionState, useEffect, useState } from 'react'
import { CodeField } from '@/components/code-field'
import { type ClaimState, claimPassAction } from './claim-actions'
import { cardClass, FormMessage, FormSection, SubmitButton, TextField } from './form-ui'
import { PassCard } from './pass-card'
import { SuccessCard } from './registration-form'

const initialState: ClaimState = { step: 'identity', message: '' }
const RESEND_SECONDS = 60

function useCountdown(restartKey: number | undefined) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (restartKey) setSeconds(RESEND_SECONDS)
  }, [restartKey])
  useEffect(() => {
    if (!seconds) return
    const timer = window.setTimeout(() => setSeconds((left) => left - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [seconds])
  return seconds
}

export function ClaimForm() {
  const [state, formAction, pending] = useActionState(claimPassAction, initialState)
  const [otp, setOtp] = useState('')
  const wait = useCountdown(state.sentAt)

  if (state.pass) {
    return (
      <SuccessCard eyebrow="Tu pase" title="Listo para correr.">
        <PassCard pass={state.pass} />
      </SuccessCard>
    )
  }

  if (state.step === 'code') {
    return (
      <form action={formAction} className={cardClass}>
        <FormSection
          step="02"
          title="Revisa tu correo"
          hint={`Si los datos coinciden, enviamos un código de 6 dígitos a ${state.values?.email ?? 'tu correo'}. Revisa también spam.`}
        />
        <input type="hidden" name="documentNumber" value={state.values?.documentNumber ?? ''} />
        <input type="hidden" name="email" value={state.values?.email ?? ''} />
        <CodeField label="Código" name="otp" value={otp} onChange={setOtp} />
        {state.message && <FormMessage>{state.message}</FormMessage>}
        <SubmitButton pending={pending} idle="Ver mi pase" busy="Comprobando…" />
        <button
          type="submit"
          name="intent"
          value="resend"
          formNoValidate
          disabled={pending || wait > 0}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 border-0 bg-transparent text-sm font-bold text-neo-text disabled:text-neo-text-secondary"
        >
          <RefreshCw aria-hidden className="size-4 shrink-0" />
          {wait > 0 ? `Reenviar código en ${wait} s` : 'Reenviar código'}
        </button>
      </form>
    )
  }

  return (
    <form action={formAction} className={cardClass}>
      <FormSection
        step="01"
        title="Recupera tu pase"
        hint="Usa el mismo documento y correo con los que te inscribiste. Te enviaremos un código."
      />
      <div className="grid gap-5">
        <TextField
          name="documentNumber"
          label="Documento"
          defaultValue={state.values?.documentNumber}
          required
          inputMode="numeric"
          autoComplete="off"
          errors={state.errors?.documentNumber}
        />
        <TextField
          name="email"
          label="Correo"
          type="email"
          defaultValue={state.values?.email}
          required
          autoComplete="email"
          errors={state.errors?.email}
        />
      </div>
      {state.message && <FormMessage>{state.message}</FormMessage>}
      <SubmitButton pending={pending} idle="Enviarme un código" busy="Enviando…" />
    </form>
  )
}
