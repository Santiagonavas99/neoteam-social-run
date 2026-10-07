'use server'

import { z } from 'zod'
import { claimPass, type Pass } from './pass'

const identitySchema = z.object({
  documentNumber: z.string().trim().min(5, 'Revisa el número de documento.').max(30),
  email: z.email('Escribe un correo válido.').max(160),
})

export type ClaimState = {
  message: string
  pass?: Pass
  errors?: Record<string, string[] | undefined>
  values?: Record<string, string>
}

export async function claimPassAction(
  _previous: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const values = {
    documentNumber: String(formData.get('documentNumber') ?? ''),
    email: String(formData.get('email') ?? ''),
  }
  const parsed = identitySchema.safeParse({ ...values, email: values.email.trim() })
  if (!parsed.success) {
    return {
      message: 'Revisa los datos e intenta de nuevo.',
      errors: parsed.error.flatten().fieldErrors,
      values,
    }
  }

  const pass = await claimPass({
    documentNumber: parsed.data.documentNumber,
    email: parsed.data.email.toLowerCase(),
  })
  if (!pass) {
    return { message: 'No encontramos una inscripción con ese documento y correo.', values }
  }
  return { message: '', pass }
}
