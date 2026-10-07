// @ts-nocheck
import { sha256 } from './proxy.ts'

export type StaffSession = { id: string; userId: string; role: 'admin' | 'checkin'; name: string }

// A session is valid only while its user is active, so deactivating someone ends it at once.
export async function requireSession(supabase, token: unknown): Promise<StaffSession | null> {
  if (typeof token !== 'string' || token.length < 32) return null
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('admin_pin_sessions')
    .select('id,user_id,admin_users!inner(name,role,active)')
    .eq('token_hash', await sha256(token))
    .gt('expires_at', now)
    .eq('admin_users.active', true)
    .maybeSingle()
  // A failed query is not an invalid session: throwing becomes a 500, and the proxy keeps the
  // cookie, whereas null makes it expire the cookie and sends staff back to the sign-in screen.
  if (error) throw error
  if (!data) return null
  const seen = await supabase
    .from('admin_pin_sessions')
    .update({ last_seen_at: now })
    .eq('id', data.id)
  if (seen.error)
    console.error('admin session last_seen_at update failed', { code: seen.error.code })
  return {
    id: data.id,
    userId: data.user_id,
    role: data.admin_users.role,
    name: data.admin_users.name,
  }
}
