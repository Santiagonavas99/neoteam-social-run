import { IANA_TLDS } from '../../lib/iana-tlds.ts'

export const MIN_BIRTH_DATE = '1900-01-01'

export function maxBirthDate(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return [get('year'), get('month'), get('day')].join('-')
}

export function isAllowedBirthDate(value: string, today = maxBirthDate()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < MIN_BIRTH_DATE || value > today) {
    return false
  }
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}

export function isEmailDomainValid(address: string): boolean {
  const parts = address.trim().split('@')
  if (parts.length !== 2) return false
  const domain = parts[1] ?? ''
  if (
    !/^(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(domain)
  ) {
    return false
  }
  return IANA_TLDS.has(domain.slice(domain.lastIndexOf('.') + 1).toLowerCase())
}

export function isNumericDocumentType(type: string): boolean {
  return type === 'CC' || type === 'CE' || type === 'TI' || type === 'PPT'
}

export function isValidDocumentNumber(value: string, type: string): boolean {
  const pattern = isNumericDocumentType(type) ? /^\d{5,30}$/ : /^[a-z\d]{5,30}$/i
  return pattern.test(value.trim())
}

export function normalizeColombianPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.length === 12 && digits.startsWith('57') ? digits.slice(2) : digits
}

export function digitsOnlyInput(value: string): string {
  return value.replace(/\D/g, '')
}
