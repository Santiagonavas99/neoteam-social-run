'use server'

import { z } from 'zod'
import { claimPass, type Pass, requestPassCode } from './pass'

const identitySchema = z.object({
  documentNumber: z.string().trim().min(5, 'Revisa el número de documento.').max(30),
  email: z.email('Escribe un correo válido.').max(160),
})

export type ClaimState = {
  step: 'identity' | 'code'
  message: string
  pass?: Pass
  errors?: Record<string, string[] | undefined>
  values?: Record<string, string>
  /** Changes on every code sent, so the form restarts its resend countdown. */
  sentAt?: number
}

export async function claimPassAction(
  previous: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const values = {
    documentNumber: String(formData.get('documentNumber') ?? ''),
    email: String(formData.get('email') ?? ''),
  }
  const parsed = identitySchema.safeParse({ ...values, email: values.email.trim() })
  if (!parsed.success) {
    return {
      step: 'identity',
      message: 'Revisa los datos e intenta de nuevo.',
      errors: parsed.error.flatten().fieldErrors,
      values,
    }
  }
  const identity = {
    documentNumber: parsed.data.documentNumber,
    email: parsed.data.email.toLowerCase(),
  }

  const intent = formData.get('intent')
  if (previous.step === 'identity' || intent === 'resend') {
    if (!(await requestPassCode(identity))) {
      return {
        ...previous,
        values,
        message: 'No pudimos enviar el código. Intenta de nuevo en unos minutos.',
      }
    }
    return { step: 'code', message: '', values, sentAt: Date.now() }
  }

  const pass = await claimPass({ ...identity, otp: String(formData.get('otp') ?? '') })
  if (!pass) {
    return {
      ...previous,
      values,
      message: 'El código no es correcto o ya venció. Pide uno nuevo.',
    }
  }
  return { step: 'code', message: '', pass }
}
