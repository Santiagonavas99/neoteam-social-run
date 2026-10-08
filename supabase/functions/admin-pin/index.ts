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
import {
  checkInParticipant,
  normalizeParticipantCode,
  participantFields,
  participantLookup,
  participantPayload,
} from '../_shared/participants.ts'
import { sendPassEmail } from '../_shared/pass-email.ts'
import { validateParticipantProfile } from '../_shared/participant-profile.ts'
import { handlePassEmailQueue } from '../_shared/pass-email-queue.ts'
import { fromProxy, sha256 } from '../_shared/proxy.ts'
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

const SESSION_DAYS = 30

const responseHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders })
}

function cleanName(value: unknown) {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
  return name.length >= 2 && name.length <= 80 ? name : null
}

const PUBLIC_ACTIONS = new Set(['requestCode', 'verifyCode', 'validate', 'logout'])
const STAFF_ACTIONS = new Set(['checkin'])

const HOME_SECTION_KEYS = new Set([
  'story',
  'numbers',
  'allies',
  'running_crews',
  'organizations',
  'agenda',
  'community',
  'raffle',
  'final',
  'landak_studio',
])

type IdRow = { id: string }
type ParticipationRow = { dynamic_id: string; status: string }

function randomUnit() {
  const value = new Uint32Array(1)
  crypto.getRandomValues(value)
  return value[0] / 0x100000000
}

function getClientIp(req: Request) {
  return req.headers.get('x-admin-client-ip')?.trim() || 'unknown'
}

async function createSession(userId: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const token = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  const tokenHash = await sha256(token)
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from('admin_pin_sessions').insert({
    token_hash: tokenHash,
    expires_at: expiresAt,
    user_id: userId,
  })
  if (error) throw error
  return { token, expiresAt }
}

async function revokeSessions(userId: string) {
  const { error } = await supabase.from('admin_pin_sessions').delete().eq('user_id', userId)
  if (error) throw error
}

async function reserveAttempt(ip: string): Promise<number | Response> {
  const { data, error } = await supabase.rpc('admin_pin_reserve_attempt', { p_ip: ip })
  if (error) {
    console.error('admin_pin_reserve_attempt failed', { code: error.code })
    return json({ error: 'No pudimos verificar el acceso. Inténtalo de nuevo.' }, 503)
  }
  if (data === null) {
    return json(
      { error: 'Demasiados intentos. Espera unos minutos antes de volver a intentar.' },
      429,
    )
  }
  return data
}

// The draw RPCs raise stable identifiers; map them to the panel's messages.
function rpcErrorResponse(
  error: { message?: string } | null,
  known: Record<string, [message: string, status: number]>,
) {
  const key = error?.message ?? ''
  if (!Object.hasOwn(known, key)) return null
  const [message, status] = known[key]
  return json({ error: message }, status)
}

async function markAttemptSuccess(attemptId: number) {
  const { error } = await supabase.rpc('admin_pin_mark_success', { p_attempt_id: attemptId })
  if (error) console.error('admin_pin_mark_success failed', { code: error.code })
}

Deno.serve(async (req: Request) => {
  if (!(await fromProxy(req))) return json({ error: 'No autorizado.' }, 401)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    const action = body?.action
    const ip = getClientIp(req)

    let session = null
    if (!PUBLIC_ACTIONS.has(action)) {
      session = await requireSession(supabase, body?.token)
      if (!session) return json({ error: 'Sesión no válida.' }, 401)
      if (session.role !== 'admin' && !STAFF_ACTIONS.has(action))
        return json({ error: 'Tu usuario no tiene acceso a esta sección.' }, 403)
    }

    if (action === 'requestCode') {
      const email = cleanEmail(body?.email)
      if (!email) return json({ error: 'Escribe un correo válido.' }, 400)
      // Same answer for unknown, inactive and throttled emails, so the form cannot list the staff.
      const sent = json({ ok: true })
      const { data: user, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', email)
        .eq('active', true)
        .maybeSingle()
      if (error) throw error
      if (!user) return sent

      const since = new Date(Date.now() - CODE_WINDOW_MINUTES * 60_000).toISOString()
      const { count, error: countError } = await supabase
        .from('admin_login_codes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gt('created_at', since)
      if (countError) throw countError
      if ((count ?? 0) >= CODES_PER_WINDOW) return sent

      const code = randomCode()
      const { error: insertError } = await supabase.from('admin_login_codes').insert({
        user_id: user.id,
        code_hash: await hashCode(user.id, code),
        expires_at: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
      })
      if (insertError) throw insertError
      const delivery = await sendEmail({ to: email, ...codeEmail(code, 'admin') })
      if (!delivery.ok)
        return json({ error: 'No pudimos enviar el correo. Inténtalo en unos minutos.' }, 424)
      return sent
    }

    if (action === 'verifyCode') {
      const email = cleanEmail(body?.email)
      const code = body?.code
      if (!email || !validCode(code))
        return json({ error: 'Escribe el código de 6 dígitos que te enviamos.' }, 400)
      const attempt = await reserveAttempt(ip)
      if (attempt instanceof Response) return attempt

      const { data: user, error } = await supabase
        .from('admin_users')
        .select('id,name,role')
        .eq('email', email)
        .eq('active', true)
        .maybeSingle()
      if (error) throw error
      const { data: pending, error: codeError } = user
        ? await supabase
            .from('admin_login_codes')
            .select('id,code_hash,attempts')
            .eq('user_id', user.id)
            .is('used_at', null)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        : { data: null, error: null }
      if (codeError) throw codeError

      const rejected = json({ error: 'El código no es correcto o ya venció. Pide uno nuevo.' }, 401)
      const usable = pending && pending.attempts < CODE_MAX_ATTEMPTS
      if (!usable) return rejected
      if (!(await codeMatches(user.id, code, pending.code_hash))) {
        await supabase
          .from('admin_login_codes')
          .update({ attempts: pending.attempts + 1 })
          .eq('id', pending.id)
        return rejected
      }

      // Only the first request to mark the code wins, so one code opens one session.
      const { data: claimed, error: claimError } = await supabase
        .from('admin_login_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', pending.id)
        .is('used_at', null)
        .select('id')
      if (claimError) throw claimError
      if (!claimed?.length) return rejected
      await markAttemptSuccess(attempt)

      const created = await createSession(user.id)
      return json({ ok: true, ...created, role: user.role, name: user.name })
    }

    if (action === 'validate') {
      const current = await requireSession(supabase, body?.token)
      return json(
        current ? { valid: true, role: current.role, name: current.name } : { valid: false },
      )
    }

    if (action === 'logout') {
      if (typeof body?.token === 'string') {
        const tokenHash = await sha256(body.token)
        await supabase.from('admin_pin_sessions').delete().eq('token_hash', tokenHash)
      }
      return json({ ok: true })
    }

    if (action === 'listHomeSections') {
      const { data, error } = await supabase
        .from('home_section_order')
        .select('section_key,sort_order,visible')
        .eq('event_code', 'SR26')
        .order('sort_order', { ascending: true })
        .order('section_key', { ascending: true })
      if (error) throw error
      return json({ rows: data ?? [] })
    }

    if (action === 'saveHomeSections') {
      const sections = Array.isArray(body?.sections) ? body.sections : []
      if (!sections.length) return json({ error: 'No hay secciones para guardar.' }, 400)

      const seen = new Set<string>()
      const updates = []
      for (const section of sections) {
        const key = typeof section?.section_key === 'string' ? section.section_key : ''
        const sortOrder = Number(section?.sort_order)
        const visible = section?.visible !== false
        if (
          !HOME_SECTION_KEYS.has(key) ||
          seen.has(key) ||
          !Number.isInteger(sortOrder) ||
          sortOrder < 1 ||
          sortOrder > 999
        ) {
          return json({ error: 'El orden de las secciones no es válido.' }, 400)
        }
        seen.add(key)
        updates.push({
          event_code: 'SR26',
          section_key: key,
          sort_order: sortOrder,
          visible,
          updated_at: new Date().toISOString(),
        })
      }

      const { error } = await supabase
        .from('home_section_order')
        .upsert(updates, { onConflict: 'event_code,section_key' })
      if (error) throw error
      return json({ ok: true })
    }
    if (action === 'listCards') {
      const { data, error } = await supabase
        .from('home_feature_cards')
        .select('id,event_code,slot,title,description,enabled,sort_order')
        .eq('event_code', 'SR26')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return json({ cards: data ?? [] })
    }

    if (action === 'saveCards') {
      const cards = Array.isArray(body?.cards) ? body.cards : []
      for (const card of cards) {
        if (!card?.id) continue
        const title = typeof card.title === 'string' ? card.title.trim().slice(0, 120) : ''
        const description =
          typeof card.description === 'string' ? card.description.trim().slice(0, 500) : ''
        const enabled = Boolean(card.enabled)
        const sortOrder = Number.isFinite(Number(card.sort_order)) ? Number(card.sort_order) : 0
        const { error } = await supabase
          .from('home_feature_cards')
          .update({ title, description, enabled, sort_order: sortOrder })
          .eq('id', card.id)
          .eq('event_code', 'SR26')
        if (error) throw error
      }
      return json({ ok: true })
    }

    // The guard above already requires an admin session here. Keep table and
    // column names server controlled; the browser never receives the service key.
    if (['adminData', 'uploadAdminImage', 'dynamicData'].includes(action)) {
      if (action === 'uploadAdminImage') {
        const mime = body?.mime
        const allowedMime = ['image/png', 'image/jpeg', 'image/webp']
        if (
          !allowedMime.includes(mime) ||
          typeof body?.content !== 'string' ||
          body.content.length > 5_600_000
        ) {
          return json({ error: 'El archivo debe ser PNG, JPG o WEBP y pesar menos de 4 MB.' }, 400)
        }
        const bytes = Uint8Array.from(atob(body.content), (char) => char.charCodeAt(0))
        if (bytes.length > 4 * 1024 * 1024)
          return json({ error: 'La imagen supera el límite de 4 MB.' }, 400)
        const isPng =
          mime === 'image/png' &&
          bytes[0] === 0x89 &&
          bytes[1] === 0x50 &&
          bytes[2] === 0x4e &&
          bytes[3] === 0x47
        const isJpeg =
          mime === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
        const isWebp =
          mime === 'image/webp' &&
          new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
          new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
        if (!isPng && !isJpeg && !isWebp)
          return json(
            { error: 'El contenido del archivo no coincide con el formato de imagen.' },
            400,
          )
        const extension = (
          { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' } as Record<
            string,
            string
          >
        )[mime]
        const path = `${crypto.randomUUID()}.${extension}`
        const { error } = await supabase.storage
          .from('admin-media')
          .upload(path, bytes, { contentType: mime, upsert: false })
        if (error) throw error
        const { data } = supabase.storage.from('admin-media').getPublicUrl(path)
        return json({ ok: true, url: data.publicUrl })
      }

      if (action === 'dynamicData') {
        const operation = body?.operation
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('id')
          .eq('code', 'SR26')
          .single()
        if (eventError) throw eventError

        const rankedWinners = async (dynamicId: string) => {
          const { data: entries, error } = await supabase
            .from('dynamic_participations')
            .select(
              'metadata,registrations(id,registration_code,first_name,last_name,status,other_running_group,running_groups(name))',
            )
            .eq('dynamic_id', dynamicId)
            .eq('status', 'winner')
          if (error) throw error
          return (entries ?? [])
            .sort(
              (a: { metadata?: { rank?: number } }, b: { metadata?: { rank?: number } }) =>
                (a.metadata?.rank ?? 0) - (b.metadata?.rank ?? 0),
            )
            .map((entry: { registrations: unknown }) => participantPayload(entry.registrations))
        }

        if (operation === 'list') {
          const { data: rows, error } = await supabase
            .from('dynamics')
            .select(
              'id,event_id,name,description,type,status,sponsor_brand_id,points,requires_checkin,prize,winner_count,eligibility_dynamic_id,legacy_raffle_id,draw_at,config,created_at',
            )
            .eq('event_id', event.id)
            .order('created_at', { ascending: false })
          if (error) throw error

          const ids = (rows ?? []).map((row: IdRow) => row.id)
          let participations: ParticipationRow[] = []
          if (ids.length) {
            const result = await supabase
              .from('dynamic_participations')
              .select('dynamic_id,status')
              .in('dynamic_id', ids)
            if (result.error) throw result.error
            participations = result.data ?? []
          }

          const counts = new Map<string, { total: number; winners: number }>()
          for (const participation of participations) {
            const current = counts.get(participation.dynamic_id) ?? { total: 0, winners: 0 }
            current.total += 1
            if (participation.status === 'winner') current.winners += 1
            counts.set(participation.dynamic_id, current)
          }

          const { data: scores, error: rankingError } = await supabase.rpc(
            'dynamic_points_ranking',
            { p_event_id: event.id },
          )
          if (rankingError) throw rankingError
          const scoreIds = (scores ?? []).map(
            (score: { registration_id: string }) => score.registration_id,
          )
          let runners: Array<Record<string, unknown> & { id: string }> = []
          if (scoreIds.length) {
            const result = await supabase
              .from('registrations')
              .select(
                'id,registration_code,first_name,last_name,status,other_running_group,running_groups(name)',
              )
              .in('id', scoreIds)
            if (result.error) throw result.error
            runners = result.data ?? []
          }

          return json({
            dynamicRows: (rows ?? []).map((row: IdRow & Record<string, unknown>) => ({
              ...row,
              participations_count: counts.get(row.id)?.total ?? 0,
              winners_count: counts.get(row.id)?.winners ?? 0,
            })),
            ranking: (scores ?? []).flatMap(
              (score: { registration_id: string; points: number }) => {
                const runner = runners.find((item) => item.id === score.registration_id)
                return runner ? [{ ...participantPayload(runner), points: score.points }] : []
              },
            ),
          })
        }

        if (operation === 'save') {
          const values = body?.values
          if (!values || typeof values !== 'object' || Array.isArray(values)) {
            return json({ error: 'Datos incompletos.' }, 400)
          }

          const allowedTypes = [
            'raffle',
            'qr',
            'checkpoint',
            'challenge',
            'trivia',
            'mission',
            'voting',
            'instant_win',
            'points',
          ]
          const allowedStatuses = ['draft', 'open', 'closed', 'completed', 'cancelled']
          const name = typeof values.name === 'string' ? values.name.trim().slice(0, 120) : ''
          if (!name) return json({ error: 'El nombre es obligatorio.' }, 400)
          if (!allowedTypes.includes(String(values.type)))
            return json({ error: 'Tipo de dinámica inválido.' }, 400)
          if (!allowedStatuses.includes(String(values.status)))
            return json({ error: 'Estado de dinámica inválido.' }, 400)

          const rawConfig =
            values.config && typeof values.config === 'object' && !Array.isArray(values.config)
              ? values.config
              : {}
          const config: Record<string, unknown> = { ...rawConfig }
          if (values.type === 'instant_win') {
            const probability = Number(config.win_probability ?? 0.1)
            config.win_probability = Number.isFinite(probability)
              ? Math.max(0, Math.min(1, probability))
              : 0.1
          }
          if (values.type === 'raffle') {
            if (!['female', 'male'].includes(String(config.gender))) delete config.gender
            config.exclude_winners = config.exclude_winners === true
          }

          const safeValues = {
            name,
            description:
              typeof values.description === 'string'
                ? values.description.trim().slice(0, 1000)
                : '',
            type: values.type,
            status: values.status,
            sponsor_brand_id:
              typeof values.sponsor_brand_id === 'string' && values.sponsor_brand_id
                ? values.sponsor_brand_id
                : null,
            points: Math.max(0, Math.floor(Number(values.points) || 0)),
            requires_checkin: values.requires_checkin !== false,
            prize: typeof values.prize === 'string' ? values.prize.trim().slice(0, 240) : '',
            winner_count: Math.max(1, Math.floor(Number(values.winner_count) || 1)),
            eligibility_dynamic_id:
              typeof values.eligibility_dynamic_id === 'string' && values.eligibility_dynamic_id
                ? values.eligibility_dynamic_id
                : null,
            config,
            updated_at: new Date().toISOString(),
          }

          if (typeof values.id === 'string' && values.id) {
            const { error } = await supabase
              .from('dynamics')
              .update(safeValues)
              .eq('id', values.id)
              .eq('event_id', event.id)
            if (error) throw error
          } else {
            const { error } = await supabase
              .from('dynamics')
              .insert({ ...safeValues, event_id: event.id })
            if (error) throw error
          }
          return json({ ok: true })
        }

        if (operation === 'delete') {
          if (typeof body?.id !== 'string' || !body.id)
            return json({ error: 'Dinámica no válida.' }, 400)
          const { error } = await supabase
            .from('dynamics')
            .delete()
            .eq('id', body.id)
            .eq('event_id', event.id)
          if (error) throw error
          return json({ ok: true })
        }

        if (operation === 'deleteDrafts') {
          const { data, error } = await supabase
            .from('dynamics')
            .delete()
            .eq('event_id', event.id)
            .eq('status', 'draft')
            .select('id')
          if (error) throw error
          return json({ ok: true, deleted: data?.length ?? 0 })
        }

        if (operation === 'complete') {
          if (typeof body?.id !== 'string' || !body.id)
            return json({ error: 'Dinámica no válida.' }, 400)
          const { data: dynamic, error: dynamicError } = await supabase
            .from('dynamics')
            .select(
              'id,event_id,name,type,status,points,requires_checkin,prize,winner_count,config',
            )
            .eq('id', body.id)
            .eq('event_id', event.id)
            .single()
          if (dynamicError) throw dynamicError
          if (dynamic.status !== 'open')
            return json(
              { error: 'La dinámica debe estar activa para registrar participaciones.' },
              409,
            )
          if (dynamic.type === 'raffle')
            return json({ error: 'Los sorteos se ejecutan con el botón Sortear.' }, 400)

          const value = normalizeParticipantCode(body?.code)
          if (!value) return json({ error: 'Escanea un QR o escribe un código.' }, 400)

          const [column, key] = participantLookup(value)
          const participantQuery = supabase
            .from('registrations')
            .select(participantFields)
            .eq('event_id', event.id)
            .eq(column, key)

          const { data: participant, error: participantError } =
            await participantQuery.maybeSingle()
          if (participantError) throw participantError
          if (!participant)
            return json({ error: 'No encontramos un participante con ese QR o código.' }, 404)
          if (participant.status === 'cancelled')
            return json({ error: 'Este registro está cancelado.' }, 409)
          if (dynamic.requires_checkin && participant.status !== 'checked_in') {
            return json({ error: 'Este participante todavía no ha hecho check-in.' }, 409)
          }

          const { data: existing, error: existingError } = await supabase
            .from('dynamic_participations')
            .select('id,status,points_awarded')
            .eq('dynamic_id', dynamic.id)
            .eq('registration_id', participant.id)
            .maybeSingle()
          if (existingError) throw existingError
          if (existing) {
            return json({
              ok: true,
              alreadyCompleted: true,
              won: existing.status === 'winner',
              prize: dynamic.prize,
              participant: participantPayload(participant),
            })
          }

          let wonRoll = false
          if (dynamic.type === 'instant_win') {
            const rawProbability = Number(dynamic.config?.win_probability ?? 0.1)
            const probability = Number.isFinite(rawProbability)
              ? Math.max(0, Math.min(1, rawProbability))
              : 0.1
            wonRoll = randomUnit() < probability
          }

          const { data: participationStatus, error: recordError } = await supabase.rpc(
            'record_dynamic_participation',
            { p_dynamic_id: dynamic.id, p_registration_id: participant.id, p_won_roll: wonRoll },
          )
          if (recordError) throw recordError
          if (participationStatus === null) {
            return json({
              ok: true,
              alreadyCompleted: true,
              participant: participantPayload(participant),
            })
          }

          return json({
            ok: true,
            alreadyCompleted: false,
            won: participationStatus === 'winner',
            prize: dynamic.prize,
            participant: participantPayload(participant),
          })
        }

        if (operation === 'eligibleCount') {
          if (typeof body?.id !== 'string' || !body.id)
            return json({ error: 'Dinámica no válida.' }, 400)
          const { data: count, error } = await supabase.rpc('dynamic_eligible_count', {
            p_dynamic_id: body.id,
            p_event_id: event.id,
          })
          if (error) throw error
          return json({ ok: true, count: count ?? 0 })
        }

        if (operation === 'draw') {
          if (typeof body?.id !== 'string' || !body.id)
            return json({ error: 'Dinámica no válida.' }, 400)
          const { data: drawn, error: drawError } = await supabase.rpc('draw_dynamic', {
            p_dynamic_id: body.id,
            p_event_id: event.id,
          })
          const known = rpcErrorResponse(drawError, {
            dynamic_not_found: ['Dinámica no válida.', 404],
            dynamic_not_raffle: ['Esta dinámica no es un sorteo.', 400],
            dynamic_not_open: ['Activa el sorteo antes de ejecutarlo.', 409],
            no_qualifying_participants: [
              'Nadie ha completado todavía la dinámica requerida para este sorteo.',
              409,
            ],
            no_eligible_participants: ['No hay participantes elegibles para este sorteo.', 409],
          })
          if (known) return known
          if (drawError) throw drawError

          const winnerDetails = await rankedWinners(body.id)
          return json({ ok: true, winners: (drawn ?? []).length, winnerDetails })
        }

        if (operation === 'winners') {
          if (typeof body?.id !== 'string' || !body.id)
            return json({ error: 'Dinámica no válida.' }, 400)
          return json({ ok: true, winnerDetails: await rankedWinners(body.id) })
        }

        if (operation === 'redraw') {
          if (
            typeof body?.id !== 'string' ||
            !body.id ||
            typeof body?.registrationId !== 'string' ||
            !body.registrationId
          )
            return json({ error: 'Datos incompletos.' }, 400)
          const { error: redrawError } = await supabase.rpc('redraw_dynamic_winner', {
            p_dynamic_id: body.id,
            p_event_id: event.id,
            p_registration_id: body.registrationId,
          })
          const known = rpcErrorResponse(redrawError, {
            dynamic_not_found: ['Dinámica no válida.', 404],
            dynamic_not_raffle: ['Esta dinámica no es un sorteo.', 400],
            winner_not_found: ['Esa persona ya no es ganadora de este sorteo.', 409],
            no_eligible_participants: ['No queda nadie más para sortear en su lugar.', 409],
          })
          if (known) return known
          if (redrawError) throw redrawError
          return json({ ok: true, winnerDetails: await rankedWinners(body.id) })
        }

        return json({ error: 'Operación de dinámica no válida.' }, 400)
      }

      const resource = body?.resource
      const operation = body?.operation
      const configs: Record<string, { table: string; fields: string; writable: string[] }> = {
        brands: {
          table: 'brands',
          fields: 'id,name,slug,logo_url,website,instagram,type,active,sort_order,show_on_home',
          writable: [
            'name',
            'slug',
            'logo_url',
            'website',
            'instagram',
            'type',
            'active',
            'sort_order',
            'show_on_home',
          ],
        },
        groups: {
          table: 'running_groups',
          fields: 'id,name,slug,logo_url,instagram,invited,active,sort_order,show_on_home',
          writable: [
            'name',
            'slug',
            'logo_url',
            'instagram',
            'invited',
            'active',
            'sort_order',
            'show_on_home',
          ],
        },
        participants: {
          table: 'registrations',
          fields:
            'id,registration_number,registration_code,first_name,last_name,document_type,document_number,email,phone,birth_date,gender,running_group_id,other_running_group,shirt_size,emergency_name,emergency_phone,status,checked_in_at,created_at,updated_at,pass_emailed_at,running_groups(name)',
          writable: ['status', 'checked_in_at'],
        },
        raffles: {
          table: 'raffles',
          fields:
            'id,event_id,name,description,prize,sponsor_brand_id,winner_count,requires_checkin,draw_at,status,created_at',
          writable: [
            'name',
            'description',
            'prize',
            'sponsor_brand_id',
            'winner_count',
            'requires_checkin',
            'draw_at',
            'status',
          ],
        },
      }
      if (resource === 'metrics' && operation === 'list') {
        const event = await supabase
          .from('events')
          .select('id,code,name,event_date,status,registration_open,checkin_open')
          .eq('code', 'SR26')
          .single()
        if (event.error) throw event.error
        const [registered, checked, groups, brands, dynamics] = await Promise.all([
          supabase
            .from('registrations')
            .select('id', { count: 'exact', head: true })
            .eq('event_id', event.data.id)
            .neq('status', 'cancelled'),
          supabase
            .from('registrations')
            .select('id', { count: 'exact', head: true })
            .eq('event_id', event.data.id)
            .eq('status', 'checked_in'),
          supabase
            .from('registrations')
            .select('running_group_id')
            .eq('event_id', event.data.id)
            .not('running_group_id', 'is', null),
          supabase.from('brands').select('id', { count: 'exact', head: true }).eq('active', true),
          supabase
            .from('dynamics')
            .select('id', { count: 'exact', head: true })
            .eq('event_id', event.data.id),
        ])
        for (const result of [registered, checked, groups, brands, dynamics])
          if (result.error) throw result.error
        return json({
          event: event.data,
          metrics: {
            registered: registered.count ?? 0,
            checkedIn: checked.count ?? 0,
            groups: new Set(
              (groups.data ?? []).map((row: { running_group_id: string }) => row.running_group_id),
            ).size,
            brands: brands.count ?? 0,
            dynamics: dynamics.count ?? 0,
          },
        })
      }
      const config = Object.hasOwn(configs, resource) ? configs[resource] : undefined
      if (!config) return json({ error: 'Sección administrativa no válida.' }, 400)

      if (resource === 'participants' && operation === 'options') {
        const groups = await supabase.from('running_groups').select('id,name,active')
          .order('name', { ascending: true })
        if (groups.error) throw groups.error
        return json({ rows: groups.data ?? [] })
      }
      if (resource === 'participants' && operation === 'list' && body?.paginated === true) {
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('id')
          .eq('code', 'SR26')
          .single()
        if (eventError) throw eventError

        const pageSize = 25
        const requestedPage = Math.max(1, Math.floor(Number(body?.page) || 1))
        const status = typeof body?.status === 'string' ? body.status.trim() : ''
        const crew = typeof body?.crew === 'string' ? body.crew.trim() : ''
        const gender = typeof body?.gender === 'string' ? body.gender.trim() : ''
        const emailStatus = typeof body?.emailStatus === 'string' ? body.emailStatus.trim() : ''
        const sort = typeof body?.sort === 'string' ? body.sort.trim() : 'newest'
        const validCrew = !crew || crew === 'custom' || crew === 'unassigned' ||
          /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(crew)
        if (!validCrew || (gender && !['female','male','non_binary','prefer_not_to_say','other'].includes(gender)) ||
          (emailStatus && !['sent', 'pending'].includes(emailStatus)) ||
          !['newest','oldest','name'].includes(sort)) {
          return json({ error: 'Alguno de los filtros no es válido.' }, 400)
        }

        const allowedStatuses = new Set(['registered', 'checked_in', 'no_show', 'cancelled'])
        if (status && !allowedStatuses.has(status)) {
          return json({ error: 'Filtro de estado inválido.' }, 400)
        }

        const rawQuery = typeof body?.query === 'string' ? body.query.trim().slice(0, 80) : ''
        const searchTokens = rawQuery
          .split(/\s+/)
          .map((token: string) => token.replace(/[(),%"'_\\]/g, '').trim())
          .filter(Boolean)
          .slice(0, 4)

        const groupIdsByToken = await Promise.all(
          searchTokens.map(async (token: string) => {
            const { data, error } = await supabase
              .from('running_groups')
              .select('id')
              .ilike('name', `%${token}%`)
              .limit(25)
            if (error) throw error
            return (data ?? []).map((row: { id: string }) => row.id)
          }),
        )

        const applyParticipantFilters = (query: unknown) => {
          let filtered = query.eq('event_id', event.id)
          if (status) filtered = filtered.eq('status', status)
          if (crew === 'custom') filtered = filtered.is('running_group_id', null).not('other_running_group', 'is', null)
          else if (crew === 'unassigned') filtered = filtered.is('running_group_id', null).is('other_running_group', null)
          else if (crew) filtered = filtered.eq('running_group_id', crew)
          if (gender) filtered = filtered.eq('gender', gender)
          if (emailStatus === 'sent') filtered = filtered.not('pass_emailed_at', 'is', null)
          else if (emailStatus === 'pending') filtered = filtered.is('pass_emailed_at', null)
          searchTokens.forEach((token: string, index: number) => {
            const filters = [
              `first_name.ilike.%${token}%`,
              `last_name.ilike.%${token}%`,
              `email.ilike.%${token}%`,
              `phone.ilike.%${token}%`,
              `document_number.ilike.%${token}%`,
              `registration_code.ilike.%${token}%`,
              `other_running_group.ilike.%${token}%`,
            ]
            const groupIds = groupIdsByToken[index] ?? []
            if (groupIds.length) filters.push(`running_group_id.in.(${groupIds.join(',')})`)
            filtered = filtered.or(filters.join(','))
          })
          return filtered
        }

        const countQuery = applyParticipantFilters(
          supabase.from('registrations').select('id', { count: 'exact', head: true }),
        )
        const statusQuery = supabase.from('registrations').select('status').eq('event_id', event.id)

        const [countResult, statusResult] = await Promise.all([countQuery, statusQuery])
        if (countResult.error) throw countResult.error
        if (statusResult.error) throw statusResult.error

        const count = countResult.count ?? 0
        const pageCount = Math.max(1, Math.ceil(count / pageSize))
        const page = Math.min(requestedPage, pageCount)
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        let rowsQuery = applyParticipantFilters(
          supabase.from('registrations').select(config.fields),
        )
        if (sort === 'name') rowsQuery = rowsQuery.order('last_name', { ascending: true })
          .order('first_name', { ascending: true }).order('id', { ascending: true })
        else rowsQuery = rowsQuery.order('created_at', { ascending: sort === 'oldest' })
          .order('id', { ascending: sort === 'oldest' })
        rowsQuery = rowsQuery.range(from, to)
        const { data: rows, error: rowsError } = await rowsQuery
        if (rowsError) throw rowsError

        const statusCounts = {
          registered: 0,
          checked_in: 0,
          no_show: 0,
          cancelled: 0,
        }
        for (const row of statusResult.data ?? []) {
          if (Object.hasOwn(statusCounts, row.status)) statusCounts[row.status] += 1
        }

        return json({
          rows: rows ?? [],
          count,
          page,
          pageSize,
          statusCounts,
        })
      }

      if (resource === 'participants' && operation === 'backup') {
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('id')
          .eq('code', 'SR26')
          .single()
        if (eventError) throw eventError

        const { data, error } = await supabase
          .from('registrations')
          .select(config.fields)
          .eq('event_id', event.id)
          .order('created_at', { ascending: false })
        if (error) throw error
        return json({ rows: data ?? [] })
      }

      if (operation === 'list') {
        let query = supabase.from(config.table).select(config.fields)
        if (resource === 'participants' || resource === 'raffles') {
          const { data: event, error } = await supabase
            .from('events')
            .select('id')
            .eq('code', 'SR26')
            .single()
          if (error) throw error
          query = query.eq('event_id', event.id)
        }
        if (resource === 'participants') query = query.order('created_at', { ascending: false })
        else if (resource === 'brands' || resource === 'groups')
          query = query.order('sort_order', { ascending: true }).order('name', { ascending: true })
        else query = query.order('created_at', { ascending: false })
        const { data, error } = await query
        if (error) throw error
        return json({ rows: data ?? [] })
      }
      if (operation === 'save') {
        const values = body?.values
        if (!values || typeof values !== 'object' || Array.isArray(values))
          return json({ error: 'Datos incompletos.' }, 400)
        const safeValues: Record<string, unknown> = {}
        for (const key of config.writable) if (key in values) safeValues[key] = values[key]
        if (resource === 'participants') {
          if (
            !['checked_in', 'registered', 'no_show', 'cancelled'].includes(
              String(safeValues.status),
            )
          )
            return json({ error: 'Estado de participante inválido.' }, 400)
          safeValues.checked_in_at =
            safeValues.status === 'checked_in' ? new Date().toISOString() : null
        } else {
          if (typeof safeValues.name !== 'string' || !safeValues.name.trim())
            return json({ error: 'El nombre es obligatorio.' }, 400)
          safeValues.name = safeValues.name.trim().slice(0, 120)
          if (resource === 'brands' || resource === 'groups')
            safeValues.slug = String(safeValues.slug || safeValues.name)
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
              .slice(0, 100)
        }
        if (values.id) {
          const { error } = await supabase.from(config.table).update(safeValues).eq('id', values.id)
          if (error) throw error
        } else {
          if (resource === 'participants')
            return json(
              { error: 'Los participantes se crean desde el formulario de registro.' },
              400,
            )
          if (resource === 'raffles') {
            const { data: event, error } = await supabase
              .from('events')
              .select('id')
              .eq('code', 'SR26')
              .single()
            if (error) throw error
            safeValues.event_id = event.id
          }
          const { error } = await supabase.from(config.table).insert(safeValues)
          if (error) throw error
        }
        return json({ ok: true })
      }
      if (operation === 'delete') {
        if (!body?.id || !['brands', 'groups', 'raffles', 'participants'].includes(resource)) {
          return json({ error: 'No se puede eliminar este registro.' }, 400)
        }

        if (resource === 'participants') {
          const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id')
            .eq('code', 'SR26')
            .single()
          if (eventError) throw eventError

          const { data: participant, error: participantError } = await supabase
            .from('registrations')
            .select('id')
            .eq('id', body.id)
            .eq('event_id', event.id)
            .maybeSingle()
          if (participantError) throw participantError
          if (!participant) return json({ error: 'Participante no encontrado.' }, 404)

          const [raffleEntries, dynamicParticipations] = await Promise.all([
            supabase.from('raffle_entries').delete().eq('registration_id', body.id),
            supabase.from('dynamic_participations').delete().eq('registration_id', body.id),
          ])
          if (raffleEntries.error) throw raffleEntries.error
          if (dynamicParticipations.error) throw dynamicParticipations.error

          const { error } = await supabase
            .from('registrations')
            .delete()
            .eq('id', body.id)
            .eq('event_id', event.id)
          if (error) throw error
          return json({ ok: true })
        }

        const { error } = await supabase.from(config.table).delete().eq('id', body.id)
        if (error) throw error
        return json({ ok: true })
      }
      if (operation === 'draw' && resource === 'raffles') {
        if (typeof body?.id !== 'string' || !body.id) return json({ error: 'Rifa no válida.' }, 400)
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('id')
          .eq('code', 'SR26')
          .single()
        if (eventError) throw eventError
        const { data: winners, error: drawError } = await supabase.rpc('draw_raffle', {
          p_raffle_id: body.id,
          p_event_id: event.id,
        })
        const known = rpcErrorResponse(drawError, {
          raffle_not_found: ['Rifa no válida.', 404],
          raffle_not_open: ['Abre la rifa antes de sortear.', 409],
          no_eligible_participants: ['No hay participantes elegibles para esta rifa.', 409],
        })
        if (known) return known
        if (drawError) throw drawError
        return json({ ok: true, winners })
      }
      return json({ error: 'Operación administrativa no válida.' }, 400)
    }

    if (action === 'checkin') {
      const value = normalizeParticipantCode(body?.code)
      if (!value || value.length > 80)
        return json({ error: 'Escanea un QR o escribe un código.' }, 400)
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('code', 'SR26')
        .single()
      if (eventError) throw eventError
      const outcome = await checkInParticipant(supabase, event.id, value)
      if (outcome.result === 'notFound')
        return json({ error: 'No encontramos ese QR o código.' }, 404)
      return json({
        ok: true,
        result: outcome.result,
        participant: participantPayload(outcome.participant),
      })
    }

    if (action === 'updateParticipantProfile') {
      const valid = validateParticipantProfile(body?.profile)
      if (!valid.ok) return json({ error: valid.error }, 400)
      const id = typeof body?.participantId === 'string' ? body.participantId : ''
      const stamp = typeof body?.updatedAt === 'string' ? body.updatedAt : ''
      if (!/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(id) ||
          !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(stamp) ||
          Number.isNaN(Date.parse(stamp))) {
        return json({ error: 'El registro cambió o no es válido. Actualiza la lista.' }, 400)
      }
      const { data: event, error: eventError } = await supabase
        .from('events').select('id').eq('code', 'SR26').single()
      if (eventError) throw eventError
      if (valid.profile.running_group_id) {
        const group = await supabase.from('running_groups').select('id')
          .eq('id', valid.profile.running_group_id).maybeSingle()
        if (group.error) throw group.error
        if (!group.data) return json({ error: 'El running crew seleccionado ya no existe.' }, 400)
      }
      const [sameEmail, sameDocument] = await Promise.all([
        supabase.from('registrations').select('id')
          .eq('event_id', event.id).eq('email', valid.profile.email).neq('id', id).limit(1),
        supabase.from('registrations').select('id')
          .eq('event_id', event.id).eq('document_number', valid.profile.document_number)
          .neq('id', id).limit(1),
      ])
      if (sameEmail.error) throw sameEmail.error
      if (sameDocument.error) throw sameDocument.error
      if (sameEmail.data?.length) return json({ error: 'Ese correo ya pertenece a otra inscripción.' }, 409)
      if (sameDocument.data?.length) return json({ error: 'Ese documento ya pertenece a otra inscripción.' }, 409)
      const result = await supabase.rpc('admin_update_registration_profile', {
        p_event_id: event.id,
        p_registration_id: id,
        p_admin_user_id: session.userId,
        p_expected_updated_at: stamp,
        p_profile: valid.profile,
      })
      if (result.error?.code === '23505')
        return json({ error: 'El correo o documento ya está registrado en este evento.' }, 409)
      if (result.error) throw result.error
      if (result.data === 'stale') return json({
        error: 'Otro administrador modificó esta inscripción. Actualiza antes de guardar.',
      }, 409)
      if (result.data === 'not_found') return json({ error: 'Inscripción no encontrada.' }, 404)
      if (result.data === 'invalid_fields' || result.data === 'invalid_group' || result.data === 'not_allowed')
        return json({ error: 'No pudimos validar la corrección. Actualiza y vuelve a intentar.' }, 400)
      return json({ ok: true, emailChanged: result.data === 'email_changed', unchanged: result.data === 'unchanged' })
    }

    if (action === 'passEmailQueue') return await handlePassEmailQueue(supabase, body)

    if (action === 'resendPass') {
      const id = typeof body?.participantId === 'string' ? body.participantId : ''
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'Participante no válido.' }, 400)
      const { data: row, error } = await supabase
        .from('registrations')
        .select(
          'id,email,first_name,last_name,registration_code,checkin_token,status,pass_emailed_at',
        )
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      if (!row || row.status === 'cancelled')
        return json({ error: 'No encontramos una inscripción activa.' }, 404)
      if (!row.pass_emailed_at)
        return json({ error: 'Este pase sigue pendiente. Envíalo desde Correos pendientes.' }, 409)
      const delivery = await sendPassEmail(row)
      if (!delivery.ok)
        return json({ error: 'No pudimos enviar el correo. Inténtalo en unos minutos.' }, 424)
      await supabase
        .from('registrations')
        .update({ pass_emailed_at: new Date().toISOString() })
        .eq('id', row.id)
      return json({ ok: true })
    }

    if (action === 'users') {
      const operation = body?.operation
      if (operation === 'list') {
        const { data, error } = await supabase
          .from('admin_users')
          .select('id,name,email,role,active')
          .order('created_at', { ascending: true })
        if (error) throw error
        return json({ rows: data ?? [] })
      }

      if (operation === 'save') {
        const values = body?.values ?? {}
        const id = typeof values.id === 'string' ? values.id : null
        const name = cleanName(values.name)
        const role = values.role === 'admin' || values.role === 'checkin' ? values.role : null
        const active = values.active !== false
        if (!name) return json({ error: 'Escribe un nombre de 2 a 80 caracteres.' }, 400)
        if (!role) return json({ error: 'Elige un rol.' }, 400)

        if (!id) {
          const email = cleanEmail(values.email)
          if (!email) return json({ error: 'Escribe un correo válido.' }, 400)
          const { error } = await supabase.from('admin_users').insert({ name, email, role, active })
          if (error) {
            if ((error as { code?: string }).code === '23505')
              return json({ error: 'Ese correo ya tiene acceso.' }, 409)
            throw error
          }
          return json({ ok: true })
        }

        if (id === session.userId && (role !== 'admin' || !active))
          return json({ error: 'No puedes quitarte tu propio acceso de administrador.' }, 400)

        const { data: before, error: beforeError } = await supabase
          .from('admin_users')
          .select('role,active')
          .eq('id', id)
          .maybeSingle()
        if (beforeError) throw beforeError
        if (!before) return json({ error: 'Ese usuario ya no existe.' }, 404)

        const { error } = await supabase
          .from('admin_users')
          .update({ name, role, active, updated_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
        // Access changed: the person signs in again under the new rules.
        if (before.role !== role || before.active !== active) await revokeSessions(id)
        return json({ ok: true })
      }

      return json({ error: 'Operación no válida.' }, 400)
    }

    return json({ error: 'Acción no válida.' }, 400)
  } catch (error) {
    console.error(error)
    return json({ error: 'Ocurrió un error inesperado.' }, 500)
  }
})
