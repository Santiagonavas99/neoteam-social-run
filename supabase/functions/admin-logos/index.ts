// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireSession } from '../_shared/session.ts'

function requireEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}

const SUPABASE_URL = requireEnv('SUPABASE_URL')
const SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const ADMIN_PROXY_SECRET = Deno.env.get('ADMIN_PROXY_SECRET')?.trim() ?? ''
const responseHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders })
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Only the Next proxy holds ADMIN_PROXY_SECRET. Digests have equal length, so the
// comparison below runs in constant time.
async function fromProxy(req: Request) {
  if (ADMIN_PROXY_SECRET.length < 32) return false
  const candidate = await sha256((req.headers.get('x-admin-proxy-secret') ?? '').trim())
  const expected = await sha256(ADMIN_PROXY_SECRET)
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
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
  if (!(await fromProxy(req))) return json({ error: 'No autorizado.' }, 401)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    const session = await requireSession(supabase, body?.token)
    if (!session) return json({ error: 'Sesión no válida.' }, 401)
    if (session.role !== 'admin')
      return json({ error: 'Tu usuario no tiene acceso a esta sección.' }, 403)

    const action = body?.action
    if (action === 'list') {
      const { data, error } = await supabase
        .from('home_logo_carousel_items')
        .select('id,event_code,name,logo_url,link_url,active,sort_order,show_in_running_crews,show_in_organizations,created_at,updated_at')
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
        show_in_running_crews: values.show_in_running_crews === true,
        show_in_organizations: values.show_in_organizations === true,
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
