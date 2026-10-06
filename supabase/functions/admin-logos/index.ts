// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function requireSession(token: unknown) {
  if (typeof token !== 'string' || token.length < 32) return null
  const tokenHash = await sha256(token)
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('admin_pin_sessions')
    .select('id,expires_at')
    .eq('token_hash', tokenHash)
    .gt('expires_at', now)
    .maybeSingle()
  if (error || !data) return null
  await supabase.from('admin_pin_sessions').update({ last_seen_at: now }).eq('id', data.id)
  return data
}

function cleanUrl(value: unknown, required = false) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return required ? null : ''
  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    const session = await requireSession(body?.token)
    if (!session) return json({ error: 'Sesión no válida.' }, 401)

    const action = body?.action
    if (action === 'list') {
      const { data, error } = await supabase
        .from('home_logo_carousel_items')
        .select('id,event_code,name,logo_url,link_url,active,sort_order,created_at,updated_at')
        .eq('event_code', 'SR26')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return json({ rows: data ?? [] })
    }

    if (action === 'save') {
      const values = body?.values
      if (!values || typeof values !== 'object' || Array.isArray(values))
        return json({ error: 'Datos incompletos.' }, 400)

      const name = typeof values.name === 'string' ? values.name.trim().slice(0, 120) : ''
      if (!name) return json({ error: 'El nombre es obligatorio.' }, 400)

      const logoUrl = cleanUrl(values.logo_url, true)
      if (!logoUrl) return json({ error: 'Añade una imagen válida para el logo.' }, 400)

      const linkUrl = cleanUrl(values.link_url, false)
      if (linkUrl === null) return json({ error: 'El enlace no es válido.' }, 400)

      const payload = {
        name,
        logo_url: logoUrl,
        link_url: linkUrl || null,
        active: values.active !== false,
        sort_order: Number.isFinite(Number(values.sort_order)) ? Number(values.sort_order) : 0,
        updated_at: new Date().toISOString(),
      }

      if (values.id) {
        const { error } = await supabase
          .from('home_logo_carousel_items')
          .update(payload)
          .eq('id', values.id)
          .eq('event_code', 'SR26')
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('home_logo_carousel_items')
          .insert({ ...payload, event_code: 'SR26' })
        if (error) throw error
      }
      return json({ ok: true })
    }

    if (action === 'delete') {
      if (!body?.id) return json({ error: 'Falta el identificador del logo.' }, 400)
      const { error } = await supabase
        .from('home_logo_carousel_items')
        .delete()
        .eq('id', body.id)
        .eq('event_code', 'SR26')
      if (error) throw error
      return json({ ok: true })
    }

    return json({ error: 'Operación no válida.' }, 400)
  } catch (error) {
    console.error(error)
    return json({ error: 'No pudimos gestionar el carrusel de logos.' }, 500)
  }
})
