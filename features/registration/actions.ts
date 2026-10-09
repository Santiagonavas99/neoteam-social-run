'use server'

import { headers } from 'next/headers'
import { calendarUrlFor } from '@/features/event/calendar'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { splitFullName } from './full-name'
import { type Pass, registeredPass } from './pass'
import { isRegistrationClosed, REGISTRATION_CLOSED_MESSAGE } from './registration-deadline'
import { registrationSchema } from './schema'

export type RegistrationState = {
  ok: boolean
  message: string
  code?: string
  pass?: Pass | null
  calendarUrl?: string
  errors?: Record<string, string[] | undefined>
  values?: Record<string, string>
  attempt?: number
}

export async function registerParticipant(
  previousState: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const values: Record<string, string> = {}
  for (const [key, value] of formData) {
    if (typeof value === 'string' && !key.startsWith('$')) values[key] = value
  }
  const attempt = (previousState.attempt ?? 0) + 1

  if (isRegistrationClosed()) {
    return { ok: false, message: REGISTRATION_CLOSED_MESSAGE, values, attempt }
  }

  // Keep the Supabase contract intact: a single full-name field in the UI,
  // firstName and lastName in the existing registration schema / RPC.
  // Legacy callers that still submit separate fields continue to work.
  if (values.fullName !== undefined) {
    const name = splitFullName(values.fullName)
    if (!name) {
      return {
        ok: false,
        message: 'Hay algunos datos por revisar.',
        errors: { fullName: ['Escribe tu nombre y al menos un apellido.'] },
        values,
        attempt,
      }
    }
    values.firstName = name.firstName
    values.lastName = name.lastName
  }

  const parsed = registrationSchema.safeParse(values)

  if (!parsed.success) {
    const errors: Record<string, string[] | undefined> = parsed.error.flatten().fieldErrors
    if (values.fullName !== undefined && (errors.firstName?.length || errors.lastName?.length)) {
      errors.fullName = [...(errors.firstName ?? []), ...(errors.lastName ?? [])]
    }
    return {
      ok: false,
      message: 'Hay algunos datos por revisar.',
      errors,
      values,
      attempt,
    }
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.rpc('register_social_run_participant', {
      p_first_name: parsed.data.firstName,
      p_last_name: parsed.data.lastName,
      p_document_type: parsed.data.documentType,
      p_document_number: parsed.data.documentNumber,
      p_email: parsed.data.email.toLowerCase(),
      p_phone: parsed.data.phone,
      p_birth_date: parsed.data.birthDate,
      p_gender: parsed.data.gender,
      p_running_group_slug: parsed.data.runningGroup,
      p_other_running_group:
        parsed.data.runningGroup === 'otro' ? (parsed.data.otherRunningGroup ?? null) : null,
      p_emergency_name: parsed.data.emergencyName,
      p_emergency_phone: parsed.data.emergencyPhone,
      p_terms_accepted: true,
      p_privacy_accepted: true,
      p_marketing_accepted: parsed.data.marketingAccepted === 'on',
    })

    if (error) {
      if (error.message.includes('INSCRIPCIONES_CERRADAS')) {
        return { ok: false, message: REGISTRATION_CLOSED_MESSAGE, values, attempt }
      }
      if (error.message.includes('Ya existe una inscripción')) {
        return {
          ok: false,
          message: 'Ya existe una inscripción con ese documento o correo.',
          values,
          attempt,
        }
      }
      throw error
    }

    const code = data as string
    // The registration is already saved; a failed lookup only hides the QR, recoverable at /pase.
    const pass = await registeredPass({
      code,
      documentNumber: parsed.data.documentNumber,
      email: parsed.data.email.toLowerCase(),
    })
    const calendarUrl = calendarUrlFor((await headers()).get('user-agent') ?? '')
    return { ok: true, message: '¡Registro completado!', code, pass, calendarUrl }
  } catch (error) {
    const isMissingConfig = error instanceof Error && error.message.includes('no está configurado')
    console.error('Registration error', error)
    return {
      ok: false,
      message: isMissingConfig
        ? 'La interfaz ya está lista. Falta conectar el proyecto de Supabase para guardar registros reales.'
        : 'No pudimos guardar el registro. Intenta nuevamente.',
      values,
      attempt,
    }
  }
}
