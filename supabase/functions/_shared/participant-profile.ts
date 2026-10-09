import { IANA_TLDS } from './iana-tlds.ts'

export type ParticipantProfile = {
  first_name: string
  last_name: string
  document_type: string
  document_number: string
  email: string
  phone: string
  birth_date: string | null
  gender: string
  running_group_id: string | null
  other_running_group: string | null
  shirt_size: string | null
  emergency_name: string
  emergency_phone: string
}

const DOC_TYPES = new Set(['CC', 'TI', 'CE', 'PA', 'PPT', 'OTRO'])
const NUMERIC_DOCUMENTS = new Set(['CC', 'CE', 'TI', 'PPT'])
const GENDERS = new Set(['female', 'male'])
const SHIRT_SIZES = new Set(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
const UUID = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i

const stringValue = (input: Record<string, unknown>, key: string) =>
  typeof input[key] === 'string' ? input[key].trim().replace(/\s+/g, ' ') : ''

function emailIsValid(value: string) {
  const parts = value.split('@')
  if (parts.length !== 2) return false
  const domain = parts[1] ?? ''
  return (
    value.length <= 160 &&
    /^[^\s@]+@[^\s@]+$/.test(value) &&
    /^(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(domain) &&
    IANA_TLDS.has(domain.slice(domain.lastIndexOf('.') + 1).toLowerCase())
  )
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01') return false
  const parsed = new Date(`${value}T00:00:00Z`)
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return (
    !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value && value <= today
  )
}

function phone(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 12 && digits.startsWith('57') ? digits.slice(2) : digits
}

export function validateParticipantProfile(
  value: unknown,
): { ok: true; profile: ParticipantProfile } | { ok: false; error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'Los datos del participante están incompletos.' }
  }
  const input = value as Record<string, unknown>
  const profile: ParticipantProfile = {
    first_name: stringValue(input, 'first_name'),
    last_name: stringValue(input, 'last_name'),
    document_type: stringValue(input, 'document_type'),
    document_number: stringValue(input, 'document_number'),
    email: stringValue(input, 'email').toLowerCase(),
    phone: phone(stringValue(input, 'phone')),
    birth_date: stringValue(input, 'birth_date') || null,
    gender: stringValue(input, 'gender'),
    running_group_id: stringValue(input, 'running_group_id') || null,
    other_running_group: stringValue(input, 'other_running_group') || null,
    shirt_size: stringValue(input, 'shirt_size') || null,
    emergency_name: stringValue(input, 'emergency_name'),
    emergency_phone: phone(stringValue(input, 'emergency_phone')),
  }
  if ([profile.first_name, profile.last_name].some((v) => v.length < 2 || v.length > 80)) {
    return { ok: false, error: 'Nombre y apellidos: escribe entre 2 y 80 caracteres.' }
  }
  if (!DOC_TYPES.has(profile.document_type))
    return { ok: false, error: 'Tipo de documento inválido.' }
  const documentPattern = NUMERIC_DOCUMENTS.has(profile.document_type)
    ? /^\d{5,30}$/
    : /^[a-z\d]{5,30}$/i
  if (!documentPattern.test(profile.document_number)) {
    return { ok: false, error: 'Revisa el documento: debe tener entre 5 y 30 caracteres válidos.' }
  }
  if (!emailIsValid(profile.email)) {
    return {
      ok: false,
      error: 'Escribe un correo con dominio válido, por ejemplo nombre@dominio.com.',
    }
  }
  if (!/^\d{10}$/.test(profile.phone) || !/^\d{10}$/.test(profile.emergency_phone)) {
    return { ok: false, error: 'Los celulares deben contener 10 dígitos, sin letras.' }
  }
  if (profile.birth_date && !validDate(profile.birth_date)) {
    return {
      ok: false,
      error: 'Fecha de nacimiento inválida: selecciona una fecha real hasta hoy.',
    }
  }
  if (!GENDERS.has(profile.gender)) return { ok: false, error: 'Género inválido.' }
  if (profile.running_group_id && !UUID.test(profile.running_group_id)) {
    return { ok: false, error: 'Running crew inválido.' }
  }
  if (profile.other_running_group && profile.other_running_group.length > 120) {
    return { ok: false, error: 'El nombre del running crew no puede superar 120 caracteres.' }
  }
  if (profile.running_group_id && profile.other_running_group) {
    return { ok: false, error: 'Selecciona un running crew o escribe otro, no ambos.' }
  }
  if (profile.shirt_size && !SHIRT_SIZES.has(profile.shirt_size)) {
    return { ok: false, error: 'Talla de camiseta inválida.' }
  }
  if (profile.emergency_name.length < 2 || profile.emergency_name.length > 120) {
    return { ok: false, error: 'Indica un contacto de emergencia válido.' }
  }
  return { ok: true, profile }
}
