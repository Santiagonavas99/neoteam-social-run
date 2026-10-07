// Keep in sync with cleanEmail in supabase/functions/_shared/otp.ts and the admin_users check.
export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function isEmail(value: string) {
  const email = normalizeEmail(value)
  return email.length <= 160 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
}
