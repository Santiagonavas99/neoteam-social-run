import { gunzipSync } from 'node:zlib'

export type ProxyEnv = Record<string, string | undefined>

// Edge Functions accept only requests carrying the shared proxy secret, so the
// client IP header below is trusted by them and cannot be forged by a caller.
export function adminUpstreamHeaders(
  request: Request,
  key: string,
  env: ProxyEnv = process.env,
): Record<string, string> | null {
  const secret = env.ADMIN_PROXY_SECRET?.trim()
  if (!secret) return null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: key,
    'x-admin-proxy-secret': secret,
  }
  // Vercel sets x-forwarded-for at its edge; outside Vercel it is caller-controlled.
  if (env.VERCEL === '1') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    if (ip) headers['x-admin-client-ip'] = ip
  }
  return headers
}

const MAX_ADMIN_BODY_BYTES = 6 * 1024 * 1024

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Gzip transport keeps 4 MB image uploads below Vercel's request limit; the
// output cap stops a small compressed body from expanding without bound.
export async function parseAdminBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed: unknown =
      request.headers.get('content-encoding') === 'gzip'
        ? JSON.parse(
            gunzipSync(Buffer.from(await request.arrayBuffer()), {
              maxOutputLength: MAX_ADMIN_BODY_BYTES,
            }).toString('utf8'),
          )
        : await request.json()
    return isRecord(parsed) && typeof parsed.action === 'string' ? parsed : null
  } catch {
    return null
  }
}

const noStore = { 'Cache-Control': 'no-store' }

export async function proxyToEdgeFunction(
  request: Request,
  functionName: string,
  connectionError: string,
  env: ProxyEnv = process.env,
): Promise<Response> {
  const log = `${functionName} proxy:`
  const url = env.SUPABASE_URL?.trim() || env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key =
    env.SUPABASE_PUBLISHABLE_KEY?.trim() || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key) {
    console.error(`${log} missing Supabase URL or publishable key`, {
      hasUrl: Boolean(url),
      hasKey: Boolean(key),
    })
    return Response.json({ error: connectionError }, { status: 503, headers: noStore })
  }
  const upstreamHeaders = adminUpstreamHeaders(request, key, env)
  if (!upstreamHeaders) {
    console.error(`${log} missing ADMIN_PROXY_SECRET`, { hasProxySecret: false })
    return Response.json({ error: connectionError }, { status: 503, headers: noStore })
  }

  const body = await parseAdminBody(request)
  if (!body) {
    return Response.json(
      { error: 'No pudimos procesar la solicitud.' },
      { status: 400, headers: noStore },
    )
  }

  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: upstreamHeaders,
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
      redirect: 'error',
    })
    if (response.status >= 500) {
      console.error(`${log} upstream failure`, { status: response.status })
      return Response.json({ error: connectionError }, { status: 502, headers: noStore })
    }
    const data: unknown = await response.json()
    return Response.json(data, { status: response.status, headers: noStore })
  } catch {
    console.error(`${log} upstream request failed`)
    return Response.json({ error: connectionError }, { status: 502, headers: noStore })
  }
}
