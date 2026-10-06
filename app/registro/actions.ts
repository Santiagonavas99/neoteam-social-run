'use server'

import { registrationSchema } from '@/lib/registration-schema'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export type RegistrationState = {
  ok: boolean
  message: string
  code?: string
  errors?: Record<string, string[] | undefined>
}

export async function registerParticipant(
  _previousState: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = registrationSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Hay algunos datos por revisar.',
      errors: parsed.error.flatten().fieldErrors,
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
      if (error.message.includes('Ya existe una inscripción')) {
        return { ok: false, message: 'Ya existe una inscripción con ese documento o correo.' }
      }
      throw error
    }

    return {
      ok: true,
      message: '¡Registro completado!',
      code: data as string,
    }
  } catch (error) {
    const isMissingConfig = error instanceof Error && error.message.includes('no está configurado')
    console.error('Registration error', error)
    return {
      ok: false,
      message: isMissingConfig
        ? 'La interfaz ya está lista. Falta conectar el proyecto de Supabase para guardar registros reales.'
        : 'No pudimos guardar el registro. Intenta nuevamente.',
    }
  }
}
