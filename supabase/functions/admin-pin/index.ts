// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const SESSION_DAYS = 30
const PBKDF2_ITERATIONS = 180_000
const ADMIN_SETUP_SECRET = Deno.env.get('ADMIN_SETUP_SECRET')?.trim() ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

function base64(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hashPin(pin: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  )
  return `pbkdf2$${PBKDF2_ITERATIONS}$${base64(salt)}$${base64(new Uint8Array(bits))}`
}

async function verifyPin(pin: string, encoded: string) {
  const [kind, iterationText, saltText, expectedText] = encoded.split('$')
  if (kind !== 'pbkdf2' || !iterationText || !saltText || !expectedText) return false
  const iterations = Number(iterationText)
  if (!Number.isFinite(iterations) || iterations < 100_000) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromBase64(saltText), iterations, hash: 'SHA-256' },
    key,
    256,
  )
  const actual = new Uint8Array(bits)
  const expected = fromBase64(expectedText)
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i]
  return diff === 0
}

function validPin(pin: unknown): pin is string {
  return typeof pin === 'string' && /^\d{6}$/.test(pin)
}

function normalizeParticipantCode(value: unknown) {
  if (typeof value !== 'string') return ''
  let result = value.trim()
  if (result.toUpperCase().startsWith('NEOTEAM-SR26:'))
    result = result.slice('NEOTEAM-SR26:'.length).trim()
  return result
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function dynamicParticipantPayload(row: any) {
  return {
    id: row.id,
    code: row.registration_code,
    firstName: row.first_name,
    lastName: row.last_name,
    status: row.status,
    group: row.running_groups?.name || row.other_running_group || 'Independiente',
  }
}

function randomUnit() {
  const value = new Uint32Array(1)
  crypto.getRandomValues(value)
  return value[0] / 0x100000000
}

function secretsMatch(candidate: unknown, expected: string) {
  if (typeof candidate !== 'string' || candidate.length > 1024) return false
  const left = new TextEncoder().encode(candidate.trim())
  const right = new TextEncoder().encode(expected)
  if (left.length !== right.length) return false
  let diff = 0
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i]
  return diff === 0
}

async function verifySetupSecret(candidate: unknown) {
  if (typeof candidate !== 'string' || ADMIN_SETUP_SECRET.length < 12 || candidate.length > 1024)
    return false
  return secretsMatch(await sha256(candidate.trim()), await sha256(ADMIN_SETUP_SECRET))
}

function getClientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || req.headers.get('cf-connecting-ip') || 'unknown'
}

async function createSession() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const token = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  const tokenHash = await sha256(token)
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from('admin_pin_sessions').insert({
    token_hash: tokenHash,
    expires_at: expiresAt,
  })
  if (error) throw error
  return { token, expiresAt }
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

async function checkRateLimit(ip: string) {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('admin_pin_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .eq('success', false)
    .gte('created_at', tenMinutesAgo)
  return (count ?? 0) < 8
}

async function recordAttempt(ip: string, success: boolean) {
  await supabase.from('admin_pin_attempts').insert({ ip, success })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    const action = body?.action
    const ip = getClientIp(req)

    if (action === 'status') {
      const { data, error } = await supabase
        .from('admin_pin_settings')
        .select('id')
        .eq('id', 1)
        .maybeSingle()
      if (error) throw error
      return json({
        configured: Boolean(data),
        setupRequiresSecret: !data,
        setupSecretReady: Boolean(data) || ADMIN_SETUP_SECRET.length >= 12,
      })
    }

    if (action === 'setup') {
      const pin = body?.pin
      if (!validPin(pin)) return json({ error: 'El PIN debe tener exactamente 6 dígitos.' }, 400)
      const { data: existing, error: existingError } = await supabase
        .from('admin_pin_settings')
        .select('id')
        .eq('id', 1)
        .maybeSingle()
      if (existingError) throw existingError
      if (existing) return json({ error: 'El PIN ya fue configurado.' }, 409)

      if (ADMIN_SETUP_SECRET.length < 12) {
        return json({ error: 'Falta configurar la clave privada de setup en Supabase.' }, 503)
      }
      if (!(await checkRateLimit(ip))) {
        return json(
          { error: 'Demasiados intentos. Espera unos minutos antes de volver a intentar.' },
          429,
        )
      }
      const setupAuthorized = await verifySetupSecret(body?.setupSecret)
      await recordAttempt(ip, setupAuthorized)
      if (!setupAuthorized) return json({ error: 'La clave privada de setup no es correcta.' }, 401)

      const pinHash = await hashPin(pin)
      const { error } = await supabase
        .from('admin_pin_settings')
        .insert({ id: 1, pin_hash: pinHash })
      if (error) {
        if ((error as { code?: string }).code === '23505')
          return json({ error: 'El PIN ya fue configurado.' }, 409)
        throw error
      }

      const session = await createSession()
      return json({ ok: true, ...session })
    }

    if (action === 'login') {
      const pin = body?.pin
      if (!validPin(pin)) return json({ error: 'Escribe un PIN de 6 dígitos.' }, 400)
      if (!(await checkRateLimit(ip))) {
        return json(
          { error: 'Demasiados intentos. Espera unos minutos antes de volver a intentar.' },
          429,
        )
      }

      const { data, error } = await supabase
        .from('admin_pin_settings')
        .select('pin_hash')
        .eq('id', 1)
        .maybeSingle()
      if (error) throw error
      if (!data) return json({ error: 'El PIN todavía no ha sido configurado.' }, 409)

      const ok = await verifyPin(pin, data.pin_hash)
      await recordAttempt(ip, ok)
      if (!ok) return json({ error: 'PIN incorrecto.' }, 401)

      const session = await createSession()
      return json({ ok: true, ...session })
    }

    if (action === 'validate') {
      const session = await requireSession(body?.token)
      return json({ valid: Boolean(session) })
    }

    if (action === 'logout') {
      if (typeof body?.token === 'string') {
        const tokenHash = await sha256(body.token)
        await supabase.from('admin_pin_sessions').delete().eq('token_hash', tokenHash)
      }
      return json({ ok: true })
    }

    if (action === 'listCards') {
      const session = await requireSession(body?.token)
      if (!session) return json({ error: 'Sesión no válida.' }, 401)
      const { data, error } = await supabase
        .from('home_feature_cards')
        .select('id,event_code,slot,title,description,enabled,sort_order')
        .eq('event_code', 'SR26')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return json({ cards: data ?? [] })
    }

    if (action === 'saveCards') {
      const session = await requireSession(body?.token)
      if (!session) return json({ error: 'Sesión no válida.' }, 401)
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

    // All event-management actions are gated by the PIN session. Keep table and
    // column names server controlled; the browser never receives the service key.
    if (['adminData', 'uploadAdminImage', 'dynamicData'].includes(action)) {
      const session = await requireSession(body?.token)
      if (!session) return json({ error: 'Sesión no válida.' }, 401)

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

        if (operation === 'list') {
          const { data: rows, error } = await supabase
            .from('dynamics')
            .select(
              'id,event_id,name,description,type,status,sponsor_brand_id,points,requires_checkin,prize,winner_count,eligibility_dynamic_id,legacy_raffle_id,draw_at,config,created_at',
            )
            .eq('event_id', event.id)
            .order('created_at', { ascending: false })
          if (error) throw error

          const ids = (rows ?? []).map((row: any) => row.id)
          let participations: any[] = []
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

          return json({
            dynamicRows: (rows ?? []).map((row: any) => ({
              ...row,
              participations_count: counts.get(row.id)?.total ?? 0,
              winners_count: counts.get(row.id)?.winners ?? 0,
            })),
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

          let participantQuery = supabase
            .from('registrations')
            .select(
              'id,registration_code,first_name,last_name,status,other_running_group,running_groups(name)',
            )
            .eq('event_id', event.id)
          participantQuery = validUuid(value)
            ? participantQuery.eq('checkin_token', value)
            : participantQuery.eq('registration_code', value.toUpperCase())

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
              participant: dynamicParticipantPayload(participant),
            })
          }

          let participationStatus = 'completed'
          if (dynamic.type === 'instant_win') {
            const { count, error: countError } = await supabase
              .from('dynamic_participations')
              .select('id', { count: 'exact', head: true })
              .eq('dynamic_id', dynamic.id)
              .eq('status', 'winner')
            if (countError) throw countError

            const rawProbability = Number(dynamic.config?.win_probability ?? 0.1)
            const probability = Number.isFinite(rawProbability)
              ? Math.max(0, Math.min(1, rawProbability))
              : 0.1
            if ((count ?? 0) < dynamic.winner_count && randomUnit() < probability)
              participationStatus = 'winner'
          }

          const now = new Date().toISOString()
          const { error: insertError } = await supabase.from('dynamic_participations').insert({
            dynamic_id: dynamic.id,
            registration_id: participant.id,
            status: participationStatus,
            points_awarded: dynamic.points,
            source: 'staff_scan',
            completed_at: now,
            updated_at: now,
          })
          if (insertError) {
            if ((insertError as { code?: string }).code === '23505') {
              return json({
                ok: true,
                alreadyCompleted: true,
                participant: dynamicParticipantPayload(participant),
              })
            }
            throw insertError
          }

          return json({
            ok: true,
            alreadyCompleted: false,
            won: participationStatus === 'winner',
            prize: dynamic.prize,
            participant: dynamicParticipantPayload(participant),
          })
        }

        if (operation === 'draw') {
          if (typeof body?.id !== 'string' || !body.id)
            return json({ error: 'Dinámica no válida.' }, 400)
          const { data: dynamic, error: dynamicError } = await supabase
            .from('dynamics')
            .select(
              'id,event_id,type,status,winner_count,requires_checkin,points,eligibility_dynamic_id',
            )
            .eq('id', body.id)
            .eq('event_id', event.id)
            .single()
          if (dynamicError) throw dynamicError
          if (dynamic.type !== 'raffle')
            return json({ error: 'Esta dinámica no es un sorteo.' }, 400)
          if (dynamic.status !== 'open')
            return json({ error: 'Activa el sorteo antes de ejecutarlo.' }, 409)

          let eligibleIds: string[] | null = null
          if (dynamic.eligibility_dynamic_id) {
            const { data: qualifying, error: qualifyingError } = await supabase
              .from('dynamic_participations')
              .select('registration_id')
              .eq('dynamic_id', dynamic.eligibility_dynamic_id)
              .in('status', ['completed', 'winner'])
            if (qualifyingError) throw qualifyingError
            eligibleIds = [...new Set((qualifying ?? []).map((row: any) => row.registration_id))]
            if (!eligibleIds.length)
              return json(
                { error: 'Nadie ha completado todavía la dinámica requerida para este sorteo.' },
                409,
              )
          }

          let eligibleQuery = supabase
            .from('registrations')
            .select(
              'id,registration_code,first_name,last_name,status,other_running_group,running_groups(name)',
            )
            .eq('event_id', dynamic.event_id)
            .in('status', dynamic.requires_checkin ? ['checked_in'] : ['registered', 'checked_in'])
          if (eligibleIds) eligibleQuery = eligibleQuery.in('id', eligibleIds)

          const { data: eligible, error: eligibleError } = await eligibleQuery
          if (eligibleError) throw eligibleError
          const shuffled = [...(eligible ?? [])]
          for (let i = shuffled.length - 1; i > 0; i--) {
            const random = new Uint32Array(1)
            crypto.getRandomValues(random)
            const j = random[0] % (i + 1)
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
          }
          shuffled.length = Math.min(shuffled.length, dynamic.winner_count)
          if (!shuffled.length)
            return json({ error: 'No hay participantes elegibles para este sorteo.' }, 409)

          const now = new Date().toISOString()
          const { error: clearError } = await supabase
            .from('dynamic_participations')
            .delete()
            .eq('dynamic_id', dynamic.id)
            .eq('status', 'winner')
          if (clearError) throw clearError

          const { error: winnersError } = await supabase.from('dynamic_participations').upsert(
            shuffled.map((winner: any) => ({
              dynamic_id: dynamic.id,
              registration_id: winner.id,
              status: 'winner',
              points_awarded: dynamic.points,
              source: 'raffle_draw',
              completed_at: now,
              updated_at: now,
            })),
            { onConflict: 'dynamic_id,registration_id' },
          )
          if (winnersError) throw winnersError

          const { error: updateError } = await supabase
            .from('dynamics')
            .update({ status: 'completed', draw_at: now, updated_at: now })
            .eq('id', dynamic.id)
          if (updateError) throw updateError

          return json({
            ok: true,
            winners: shuffled.length,
            winnerDetails: shuffled.map(dynamicParticipantPayload),
          })
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
            'id,registration_number,registration_code,first_name,last_name,document_type,document_number,email,phone,running_group_id,other_running_group,shirt_size,status,checked_in_at,created_at,running_groups(name)',
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
            groups: new Set((groups.data ?? []).map((row: any) => row.running_group_id)).size,
            brands: brands.count ?? 0,
            dynamics: dynamics.count ?? 0,
          },
        })
      }
      const config = configs[resource]
      if (!config) return json({ error: 'Sección administrativa no válida.' }, 400)
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
        const { data: raffle, error: raffleError } = await supabase
          .from('raffles')
          .select('id,event_id,winner_count,requires_checkin,status')
          .eq('id', body?.id)
          .single()
        if (raffleError) throw raffleError
        if (raffle.status !== 'open') return json({ error: 'Abre la rifa antes de sortear.' }, 409)
        let entries = supabase
          .from('registrations')
          .select('id')
          .eq('event_id', raffle.event_id)
          .neq('status', 'cancelled')
        if (raffle.requires_checkin) entries = entries.eq('status', 'checked_in')
        const { data: eligible, error: eligibleError } = await entries
        if (eligibleError) throw eligibleError
        const shuffled = [...(eligible ?? [])]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const random = new Uint32Array(1)
          crypto.getRandomValues(random)
          const j = random[0] % (i + 1)
          ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        shuffled.length = Math.min(shuffled.length, raffle.winner_count)
        if (!shuffled.length)
          return json({ error: 'No hay participantes elegibles para esta rifa.' }, 409)
        const now = new Date().toISOString()
        const { error: clearError } = await supabase
          .from('raffle_entries')
          .delete()
          .eq('raffle_id', raffle.id)
        if (clearError) throw clearError
        const { error: insertError } = await supabase
          .from('raffle_entries')
          .insert(
            shuffled.map((winner: any) => ({
              raffle_id: raffle.id,
              registration_id: winner.id,
              is_winner: true,
              drawn_at: now,
            })),
          )
        if (insertError) throw insertError
        const { error: updateError } = await supabase
          .from('raffles')
          .update({ status: 'drawn', draw_at: now })
          .eq('id', raffle.id)
        if (updateError) throw updateError
        return json({ ok: true, winners: shuffled.length })
      }
      return json({ error: 'Operación administrativa no válida.' }, 400)
    }

    if (action === 'changePin') {
      const session = await requireSession(body?.token)
      if (!session) return json({ error: 'Sesión no válida.' }, 401)
      const currentPin = body?.currentPin
      const newPin = body?.newPin
      if (!validPin(currentPin)) return json({ error: 'Escribe tu PIN actual de 6 dígitos.' }, 400)
      if (!validPin(newPin))
        return json({ error: 'El nuevo PIN debe tener exactamente 6 dígitos.' }, 400)
      if (!(await checkRateLimit(ip))) {
        return json(
          { error: 'Demasiados intentos. Espera unos minutos antes de volver a intentar.' },
          429,
        )
      }
      const { data: currentSettings, error: currentSettingsError } = await supabase
        .from('admin_pin_settings')
        .select('pin_hash')
        .eq('id', 1)
        .maybeSingle()
      if (currentSettingsError) throw currentSettingsError
      const currentPinIsValid = Boolean(
        currentSettings && (await verifyPin(currentPin, currentSettings.pin_hash)),
      )
      await recordAttempt(ip, currentPinIsValid)
      if (!currentPinIsValid) {
        return json({ error: 'El PIN actual no es correcto.' }, 401)
      }
      const pinHash = await hashPin(newPin)
      const freshSession = await createSession()
      const { error } = await supabase
        .from('admin_pin_settings')
        .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
        .eq('id', 1)
      if (error) {
        await supabase
          .from('admin_pin_sessions')
          .delete()
          .eq('token_hash', await sha256(freshSession.token))
        throw error
      }
      const { error: revokeError } = await supabase
        .from('admin_pin_sessions')
        .delete()
        .neq('token_hash', await sha256(freshSession.token))
      if (revokeError) throw revokeError
      return json({ ok: true, ...freshSession })
    }

    return json({ error: 'Acción no válida.' }, 400)
  } catch (error) {
    console.error(error)
    return json({ error: 'Ocurrió un error inesperado.' }, 500)
  }
})
