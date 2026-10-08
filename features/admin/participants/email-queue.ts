export const EMAIL_BATCH_SIZE = 10

export type PendingEmail = {
  id: string
  registration_number: number
  first_name: string
  last_name: string
  email: string
  created_at: string
  pass_email_last_error: string | null
  pass_email_last_attempt_at: string | null
}

export type EmailQueue = {
  rows: PendingEmail[]
  pending: number
  sent: number
  failed: number
}

export function batchRecipients(rows: PendingEmail[]) {
  return rows.slice(0, EMAIL_BATCH_SIZE)
}

export function emailFailureLabel(code: string | null) {
  switch (code) {
    case 'rate_limited':
      return 'Límite diario de Resend'
    case 'not_configured':
      return 'Servicio de correo sin configurar'
    case 'provider_error':
      return 'Rechazado por Resend'
    case 'connection_error':
      return 'Error de conexión'
    default:
      return 'Sin intento fallido'
  }
}
