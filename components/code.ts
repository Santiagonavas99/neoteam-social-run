export function normalizeCode(value: string) {
  return value.replace(/\D/g, '').slice(0, 6)
}

export function isCode(value: string) {
  return /^\d{6}$/.test(value)
}
