// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function requireEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}

const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
})

const ADMIN_PROXY_SECRET = Deno.env.get('ADMIN_PROXY_SECRET')?.trim() ?? ''
const responseHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders })
}

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function secretsMatch(candidate: string, expected: string) {
  const left = new TextEncoder().encode(candidate)
  const right = new TextEncoder().encode(expected)
  if (left.length !== right.length) return false
  let diff = 0
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i]
  return diff === 0
}

// Same gate as admin-pin: only the Next server holds the proxy secret.
async function fromProxy(req: Request) {
  if (ADMIN_PROXY_SECRET.length < 32) return false
  const candidate = (req.headers.get('x-admin-proxy-secret') ?? '').slice(0, 1024).trim()
  return secretsMatch(await sha256(candidate), await sha256(ADMIN_PROXY_SECRET))
}

type PassRow = {
  registration_code: string
  checkin_token: string
  first_name: string
  last_name: string
  email: string
  status: string
}

const notFound = () => json({ error: 'No encontramos una inscripción con esos datos.' }, 404)

Deno.serve(async (req: Request) => {
  if (!(await fromProxy(req))) return json({ error: 'No autorizado.' }, 401)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    if (body?.action !== 'claim') return json({ error: 'Acción no válida.' }, 400)

    const code = text(body?.code, 40).toUpperCase()
    const documentNumber = text(body?.documentNumber, 40)
    const email = text(body?.email, 180).toLowerCase()
    if (!documentNumber || !email) return json({ error: 'Datos incompletos.' }, 400)

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('code', 'SR26')
      .single()
    if (eventError) throw eventError

    let query = supabase
      .from('registrations')
      .select('registration_code,checkin_token,first_name,last_name,email,status')
      .eq('event_id', event.id)
      .eq('document_number', documentNumber)
    if (code) query = query.eq('registration_code', code)

    const { data, error } = await query.limit(2)
    if (error) throw error
    const rows = (data ?? []) as PassRow[]
    const row = rows.find((candidate) => candidate.email.trim().toLowerCase() === email)
    // Unknown document, wrong email and cancelled look the same, so the endpoint cannot probe people.
    if (!row || row.status === 'cancelled') return notFound()

    return json({
      ok: true,
      code: row.registration_code,
      checkinToken: row.checkin_token,
      firstName: row.first_name,
      lastName: row.last_name,
      status: row.status,
    })
  } catch (error) {
    console.error('registration-pass', { message: error?.message })
    return json({ error: 'No pudimos preparar el pase.' }, 500)
  }
})
