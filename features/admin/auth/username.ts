// Keep in sync with cleanUsername in supabase/functions/admin-pin and the admin_users check.
export function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

export function isUsername(value: string) {
  return /^[a-z0-9._-]{3,32}$/.test(normalizeUsername(value))
}
