import { z } from 'zod'

export const registrationSchema = z
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
