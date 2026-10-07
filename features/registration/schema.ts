import { z } from 'zod'
import { RUNNING_GROUP_VALUES } from './running-groups.ts'

// Phone autofill on iOS and Android fills "+57 300 123 4567"; keep the 10 national digits.
const phoneSchema = z
  .string()
  .transform((value) => {
    const digits = value.replace(/\D/g, '')
    return digits.length === 12 && digits.startsWith('57') ? digits.slice(2) : digits
  })
  .pipe(z.string().regex(/^\d{10}$/, 'Escribe un número de 10 dígitos, sin +57.'))

export const registrationSchema = z
  .object({
    firstName: z.string().trim().min(2, 'Escribe tu nombre.').max(80),
    lastName: z.string().trim().min(2, 'Escribe tu apellido.').max(80),
    documentType: z.enum(['CC', 'CE', 'TI', 'PA', 'PPT', 'OTRO']),
    documentNumber: z.string().trim().min(5, 'Revisa el número de documento.').max(30),
    email: z.email('Escribe un correo válido.').max(160),
    phone: phoneSchema,
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona tu fecha de nacimiento.'),
    gender: z.enum(['female', 'male'], { error: 'Selecciona tu género.' }),
    runningGroup: z.enum(RUNNING_GROUP_VALUES),
    otherRunningGroup: z.string().trim().max(120).optional(),
    emergencyName: z.string().trim().min(2, 'Escribe el contacto de emergencia.').max(120),
    emergencyPhone: phoneSchema,
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
