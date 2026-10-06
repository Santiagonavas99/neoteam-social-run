export function normalizePin(value: string) {
  return value.replace(/\D/g, '').slice(0, 6)
}

export function isPin(value: string) {
  return /^\d{6}$/.test(value)
}
