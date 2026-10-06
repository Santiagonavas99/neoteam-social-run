import { adminUpstreamHeaders } from '@/lib/admin-proxy'

export const runtime = 'nodejs'

const connectionError = 'No pudimos conectar con el carrusel de logos. Inténtalo de nuevo.'
const headers = { 'Cache-Control': 'no-store' }

export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key) {
    console.error('Logo admin proxy: missing Supabase URL or publishable key', {
      hasUrl: Boolean(url),
      hasKey: Boolean(key),
    })
    return Response.json({ error: connectionError }, { status: 503, headers })
  }
  const upstreamHeaders = adminUpstreamHeaders(request, key)
  if (!upstreamHeaders) {
    console.error('Logo admin proxy: missing ADMIN_PROXY_SECRET', { hasProxySecret: false })
    return Response.json({ error: connectionError }, { status: 503, headers })
  }

  let body: Record<string, unknown>
  try {
    const parsed = await request.json()
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed) ||
      typeof parsed.action !== 'string'
    )
      throw new Error('Invalid body')
    body = parsed
  } catch {
    return Response.json({ error: 'No pudimos procesar la solicitud.' }, { status: 400, headers })
  }

  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/functions/v1/admin-logos`, {
      method: 'POST',
      headers: upstreamHeaders,
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
      redirect: 'error',
    })
    if (response.status >= 500) {
      console.error('Logo admin proxy: upstream failure', { status: response.status })
      return Response.json({ error: connectionError }, { status: 502, headers })
    }
    const data = await response.json().catch(() => ({ error: connectionError }))
    return Response.json(data, { status: response.status, headers })
  } catch {
    console.error('Logo admin proxy: upstream request failed')
    return Response.json({ error: connectionError }, { status: 502, headers })
  }
}
