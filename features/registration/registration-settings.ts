import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { RegistrationSettings } from './registration-deadline'

export async function getRegistrationSettings(): Promise<RegistrationSettings | null> {
  try {
    const { data, error } = await createServerSupabaseClient().rpc(
      'get_sr26_registration_settings',
    )
    if (error) throw error
    const row = data?.[0] as
      | { deadline?: string | null; registration_open?: boolean }
      | undefined
    if (!row || typeof row.registration_open !== 'boolean') return null
    return {
      deadline: typeof row.deadline === 'string' ? row.deadline : null,
      registrationOpen: row.registration_open,
    }
  } catch (error) {
    console.error('Registration settings unavailable', error)
    return null
  }
}
