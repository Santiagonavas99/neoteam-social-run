'use client'

import { useActionState } from 'react'
import { type ClaimState, claimPassAction } from './claim-actions'
import { cardClass, FormMessage, FormSection, SubmitButton, TextField } from './form-ui'
import { PassCard } from './pass-card'
import { SuccessCard } from './registration-form'

const initialState: ClaimState = { message: '' }

export function ClaimForm() {
  const [state, formAction, pending] = useActionState(claimPassAction, initialState)

  if (state.pass) {
    return (
      <SuccessCard eyebrow="Tu pase" title="Listo para correr.">
        <PassCard pass={state.pass} />
      </SuccessCard>
    )
  }

  return (
    <form action={formAction} className={cardClass}>
      <FormSection
        step="01"
        title="Recupera tu pase"
        hint="Usa el mismo documento y correo con los que te inscribiste."
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
      <SubmitButton pending={pending} idle="Ver mi pase" busy="Buscando…" />
    </form>
  )
}
