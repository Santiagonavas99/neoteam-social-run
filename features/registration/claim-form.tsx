'use client'

import { ArrowRight, CircleAlert, LoaderCircle } from 'lucide-react'
import { useActionState } from 'react'
import { type ClaimState, claimPassAction } from './claim-actions'
import { PassCard } from './pass-card'
import { FieldError } from './registration-form'

const initialState: ClaimState = { message: '' }

export function ClaimForm() {
  const [state, formAction, pending] = useActionState(claimPassAction, initialState)

  if (state.pass) {
    return (
      <div className="success-card">
        <p className="section-label">TU PASE</p>
        <h2>LISTO PARA CORRER.</h2>
        <PassCard pass={state.pass} />
      </div>
    )
  }

  return (
    <form action={formAction} className="registration-form">
      <div className="form-section-title">
        <span>01</span>
        <div>
          <strong>Recupera tu pase</strong>
          <small>Usa el mismo documento y correo con los que te inscribiste.</small>
        </div>
      </div>
      <label>
        Documento
        <input
          name="documentNumber"
          defaultValue={state.values?.documentNumber}
          required
          inputMode="numeric"
          autoComplete="off"
        />
        <FieldError errors={state.errors?.documentNumber} />
      </label>
      <label>
        Correo
        <input
          name="email"
          type="email"
          defaultValue={state.values?.email}
          required
          autoComplete="email"
        />
        <FieldError errors={state.errors?.email} />
      </label>
      {state.message && (
        <p className="form-message flex items-start gap-2">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}
      <button className="button submit-button" type="submit" disabled={pending}>
        {pending ? 'Buscando…' : 'Ver mi pase'}
        {pending ? (
          <LoaderCircle aria-hidden className="size-4 shrink-0 motion-safe:animate-spin" />
        ) : (
          <ArrowRight aria-hidden className="size-4 shrink-0" />
        )}
      </button>
    </form>
  )
}
