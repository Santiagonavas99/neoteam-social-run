'use server'

import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const registrationSchema = z
  .object({
    firstName: z.string().trim().min(2, 'Escribe tu nombre.').max(80),
    lastName: z.string().trim().min(2, 'Escribe tu apellido.').max(80),
    documentType: z.enum(['CC', 'CE', 'TI', 'PA', 'PPT', 'OTRO']),
    documentNumber: z.string().trim().min(5, 'Revisa el número de documento.').max(30),
    email: z.email('Escribe un correo válido.').max(160),
    phone: z.string().trim().min(7, 'Escribe un celular válido.').max(30),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona tu fecha de nacimiento.'),
    runningGroup: z.enum(['neoteam', 'independiente', 'otro']),
    otherRunningGroup: z.string().trim().max(120).optional(),
    emergencyName: z.string().trim().min(2, 'Escribe el contacto de emergencia.').max(120),
    emergencyPhone: z.string().trim().min(7, 'Escribe el celular de emergencia.').max(30),
    termsAccepted: z.literal('on', { error: 'Debes aceptar los términos.' }),
    privacyAccepted: z.literal('on', { error: 'Debes aceptar el tratamiento de datos.' }),
    marketingAccepted: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.runningGroup === 'otro' && !data.otherRunningGroup?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['otherRunningGroup'],
        message: 'Escribe el nombre de tu grupo.',
      })
    }
  })

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
