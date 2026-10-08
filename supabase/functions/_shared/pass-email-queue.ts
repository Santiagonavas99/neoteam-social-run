// @ts-nocheck
import { sendPassEmail } from './pass-email.ts'

const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers })

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PAGE_SIZE = 25

// All calls enter through admin-pin's existing authenticated admin-only session guard.
// The browser cannot query this function or the registrations table directly.
export async function handlePassEmailQueue(supabase, body: Record<string, unknown>) {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('code', 'SR26')
    .single()
  if (eventError) throw eventError

  const active = () =>
    supabase.from('registrations').select('id', { count: 'exact', head: true })
      .eq('event_id', event.id).neq('status', 'cancelled')

  if (body?.operation === 'list') {
    const [pending, sent, failed, rows] = await Promise.all([
      active().is('pass_emailed_at', null),
      active().not('pass_emailed_at', 'is', null),
      active().is('pass_emailed_at', null).not('pass_email_last_error', 'is', null),
      supabase.from('registrations')
        .select('id,registration_number,first_name,last_name,email,created_at,pass_email_last_error,pass_email_last_attempt_at')
        .eq('event_id', event.id)
        .neq('status', 'cancelled')
        .is('pass_emailed_at', null)
        .order('created_at', { ascending: true })
        .order('registration_number', { ascending: true })
        .limit(PAGE_SIZE),
    ])
    for (const result of [pending, sent, failed, rows]) if (result.error) throw result.error
    return json({
      ok: true,
      pending: pending.count ?? 0,
      sent: sent.count ?? 0,
      failed: failed.count ?? 0,
      rows: rows.data ?? [],
      pageSize: PAGE_SIZE,
    })
  }

  if (body?.operation !== 'send') return json({ error: 'Operación no válida.' }, 400)
  const participantId = typeof body?.participantId === 'string' ? body.participantId : ''
  if (!UUID.test(participantId)) return json({ error: 'Participante no válido.' }, 400)

  // The same atomic pass_emailed_at claim is already used by the normal registration path.
  // Only one administrator/request can claim an unemailed active registration.
  const claimedAt = new Date().toISOString()
  const { data: row, error: claimError } = await supabase.from('registrations')
    .update({
      pass_emailed_at: claimedAt,
      pass_email_last_attempt_at: claimedAt,
      pass_email_last_error: null,
    })
    .eq('id', participantId)
    .eq('event_id', event.id)
    .neq('status', 'cancelled')
    .is('pass_emailed_at', null)
    .select('id,email,first_name,last_name,registration_code,checkin_token')
    .maybeSingle()
  if (claimError) throw claimError
  if (!row) return json({ ok: true, queueResult: 'skipped' })

  let delivery = { ok: false, status: 0 }
  try {
    // Stable key for the initial confirmation email; distinct from an intentional manual resend.
    delivery = await sendPassEmail(row, { idempotencyKey: `sr26-pass-${row.id}` })
  } catch {
    console.error('pass queue email build/network failure')
  }
  if (delivery.ok) return json({ ok: true, queueResult: 'sent' })

  const reason = delivery.status === 429
    ? 'rate_limited'
    : delivery.status === 503
      ? 'not_configured'
      : delivery.status > 0
        ? 'provider_error'
        : 'connection_error'
  // Release only our own claim. Later successful sends cannot be rolled back by a stale request.
  const { error: releaseError } = await supabase.from('registrations')
    .update({ pass_emailed_at: null, pass_email_last_error: reason })
    .eq('id', row.id)
    .eq('pass_emailed_at', claimedAt)
  if (releaseError) {
    console.error('pass queue claim release failed', { code: releaseError.code })
    return json({ error: 'No pudimos actualizar el envío. Actualiza la bandeja antes de reintentar.' }, 503)
  }
  return json({ ok: true, queueResult: 'failed', reason })
}
