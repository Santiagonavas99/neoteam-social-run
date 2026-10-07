// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { codeEmail, sendEmail } from '../_shared/email.ts'
import {
  CODE_MAX_ATTEMPTS,
  CODE_MINUTES,
  CODE_WINDOW_MINUTES,
  CODES_PER_WINDOW,
  cleanEmail,
  codeMatches,
  hashCode,
  randomCode,
  validCode,
} from '../_shared/otp.ts'
import { sendPassEmail } from '../_shared/pass-email.ts'
import { fromProxy } from '../_shared/proxy.ts'

function requireEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}

const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
})

const responseHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders })
}

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

type PassRow = {
  id: string
  registration_code: string
  checkin_token: string
  first_name: string
  last_name: string
  email: string
  status: string
  created_at: string
  pass_emailed_at: string | null
}

const notFound = () => json({ error: 'No encontramos una inscripción con esos datos.' }, 404)
const wrongCode = () =>
  json({ error: 'El código no es correcto o ya venció. Pide uno nuevo.' }, 401)

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const passFields =
  'id,registration_code,checkin_token,first_name,last_name,email,status,created_at,pass_emailed_at'
// The pass is shown and emailed without a code only right after registering.
const FRESH_MINUTES = 15

function passBody(row: PassRow, extra: Record<string, unknown> = {}) {
  return {
    ok: true,
    code: row.registration_code,
    checkinToken: row.checkin_token,
    firstName: row.first_name,
    lastName: row.last_name,
    status: row.status,
    ...extra,
  }
}

// Unknown document, wrong email and cancelled look the same, so the endpoint cannot probe people.
async function findRegistration(eventId: string, body: Record<string, unknown>, code = '') {
  const documentNumber = text(body?.documentNumber, 40)
  const email = cleanEmail(body?.email)
  if (!documentNumber || !email) return null
  let query = supabase
    .from('registrations')
    .select(passFields)
    .eq('event_id', eventId)
    .eq('document_number', documentNumber)
  if (code) query = query.eq('registration_code', code)
  const { data, error } = await query.limit(2)
  if (error) throw error
  const row = ((data ?? []) as PassRow[]).find(
    (candidate) => candidate.email.trim().toLowerCase() === email,
  )
  return row && row.status !== 'cancelled' ? row : null
}

Deno.serve(async (req: Request) => {
  if (!(await fromProxy(req))) return json({ error: 'No autorizado.' }, 401)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    const action = body?.action
    if (!['pass', 'registered', 'requestCode', 'claim'].includes(action))
      return json({ error: 'Acción no válida.' }, 400)

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('code', 'SR26')
      .single()
    if (eventError) throw eventError

    if (action === 'pass') {
      const token = text(body?.token, 40)
      if (!UUID.test(token)) return notFound()
      const { data, error } = await supabase
        .from('registrations')
        .select(passFields)
        .eq('event_id', event.id)
        .eq('checkin_token', token)
        .maybeSingle()
      if (error) throw error
      if (!data || data.status === 'cancelled') return notFound()
      return json(passBody(data as PassRow))
    }

    if (action === 'registered') {
      const code = text(body?.code, 40).toUpperCase()
      if (!code) return notFound()
      const row = await findRegistration(event.id, body, code)
      const fresh = row && Date.now() - Date.parse(row.created_at) < FRESH_MINUTES * 60_000
      if (!fresh) return notFound()
      if (row.pass_emailed_at) return json(passBody(row, { emailed: true }))

      // Claim the send first, so a double submit cannot email the pass twice.
      const { data: claimed, error } = await supabase
        .from('registrations')
        .update({ pass_emailed_at: new Date().toISOString() })
        .eq('id', row.id)
        .is('pass_emailed_at', null)
        .select('id')
      if (error) throw error
      if (!claimed?.length) return json(passBody(row, { emailed: true }))
      const delivery = await sendPassEmail(row)
      if (!delivery.ok)
        await supabase.from('registrations').update({ pass_emailed_at: null }).eq('id', row.id)
      return json(passBody(row, { emailed: delivery.ok }))
    }

    if (action === 'requestCode') {
      // Same answer whether or not the data match, so the form cannot tell who registered.
      const sent = json({ ok: true })
      const row = await findRegistration(event.id, body)
      if (!row) return sent

      const since = new Date(Date.now() - CODE_WINDOW_MINUTES * 60_000).toISOString()
      const { count, error: countError } = await supabase
        .from('pass_email_codes')
        .select('id', { count: 'exact', head: true })
        .eq('registration_id', row.id)
        .gt('created_at', since)
      if (countError) throw countError
      if ((count ?? 0) >= CODES_PER_WINDOW) return sent

      const code = randomCode()
      const { error: insertError } = await supabase.from('pass_email_codes').insert({
        registration_id: row.id,
        code_hash: await hashCode(row.id, code),
        expires_at: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
      })
      if (insertError) throw insertError
      const delivery = await sendEmail({ to: row.email, ...codeEmail(code, 'pass') })
      if (!delivery.ok)
        return json(
          { error: 'No pudimos enviar el código. Intenta de nuevo en unos minutos.' },
          503,
        )
      return sent
    }

    const otp = body?.otp
    if (!validCode(otp)) return json({ error: 'Escribe el código de 6 dígitos.' }, 400)
    const row = await findRegistration(event.id, body)
    if (!row) return wrongCode()
    const { data: pending, error: codeError } = await supabase
      .from('pass_email_codes')
      .select('id,code_hash,attempts')
      .eq('registration_id', row.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (codeError) throw codeError
    if (!pending || pending.attempts >= CODE_MAX_ATTEMPTS) return wrongCode()
    if (!(await codeMatches(row.id, otp, pending.code_hash))) {
      await supabase
        .from('pass_email_codes')
        .update({ attempts: pending.attempts + 1 })
        .eq('id', pending.id)
      return wrongCode()
    }
    const { data: used, error: useError } = await supabase
      .from('pass_email_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', pending.id)
      .is('used_at', null)
      .select('id')
    if (useError) throw useError
    if (!used?.length) return wrongCode()
    return json(passBody(row))
  } catch (error) {
    console.error('registration-pass', { message: error?.message })
    return json({ error: 'No pudimos preparar el pase.' }, 500)
  }
})
