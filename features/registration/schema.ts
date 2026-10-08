import { z } from 'zod'
import { RUNNING_GROUP_VALUES } from './running-groups.ts'
import {
  isAllowedBirthDate,
  isEmailDomainValid,
  isNumericDocumentType,
  isValidDocumentNumber,
  normalizeColombianPhone,
} from './validation.ts'

// Phone autofill on iOS and Android fills "+57 300 123 4567"; keep the 10 national digits.
const phoneSchema = z
  .string()
  .transform(normalizeColombianPhone)
  .pipe(z.string().regex(/^\d{10}$/, 'Escribe un número de 10 dígitos, sin +57.'))

export const registrationSchema = z
  .object({
    firstName: z.string().trim().min(2, 'Escribe tu nombre.').max(80),
    lastName: z.string().trim().min(2, 'Escribe tu apellido.').max(80),
    documentType: z.enum(['CC', 'CE', 'TI', 'PA', 'PPT', 'OTRO']),
    documentNumber: z.string().trim(),
    email: z
      .string()
      .trim()
      .max(160)
      .refine(
        (value) => z.email().safeParse(value).success && isEmailDomainValid(value),
        'Escribe un correo válido con dominio (ejemplo: nombre@dominio.com).',
      ),
    phone: phoneSchema,
    birthDate: z
      .string()
      .refine(
        isAllowedBirthDate,
        'Selecciona una fecha real entre 1900 y hoy.',
      ),
    gender: z.enum(['female', 'male'], { error: 'Selecciona tu género de nacimiento.' }),
    runningGroup: z.enum(RUNNING_GROUP_VALUES),
    otherRunningGroup: z.string().trim().max(120).optional(),
    emergencyName: z.string().trim().min(2, 'Escribe el contacto de emergencia.').max(120),
    emergencyPhone: phoneSchema,
    termsAccepted: z.literal('on', { error: 'Debes aceptar los términos.' }),
    privacyAccepted: z.literal('on', { error: 'Debes aceptar el tratamiento de datos.' }),
    marketingAccepted: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!isValidDocumentNumber(data.documentNumber, data.documentType)) {
      ctx.addIssue({
        code: 'custom',
        path: ['documentNumber'],
        message: isNumericDocumentType(data.documentType)
          ? 'Escribe entre 5 y 30 dígitos, sin letras.'
          : 'Escribe entre 5 y 30 letras o números, sin espacios.',
      })
    }
    if (data.runningGroup === 'otro' && !data.otherRunningGroup?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['otherRunningGroup'],
        message: 'Escribe el nombre de tu grupo.',
      })
    }
  })
