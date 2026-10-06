'use client'

import { createClient } from '@supabase/supabase-js'
import { supabasePublishableKey, supabaseUrl } from '@/lib/supabase/config'

export function createBrowserSupabaseClient() {
  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}
