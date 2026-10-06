import { adminUpstreamHeaders, type ProxyEnv, supabaseEndpoint } from './admin-proxy.ts'

export type EdgeResult = { status: number; data: unknown }

// Server-only: the proxy secret lives in a non-public env var, so this never works in a browser bundle.
export async function callEdgeFunction(
  name: string,
  body: Record<string, unknown>,
  env: ProxyEnv = process.env,
): Promise<EdgeResult | null> {
  const { url, key } = supabaseEndpoint(env)
  const headers = key ? adminUpstreamHeaders({ headers: new Headers() }, key, env) : null
  if (!url || !headers) {
    console.error(`${name}: missing Supabase URL, publishable key or ADMIN_PROXY_SECRET`)
    return null
  }

  try {
    const response = await fetch(`${url}/functions/v1/${name}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
      redirect: 'error',
    })
    if (response.status >= 500) {
      console.error(`${name}: upstream failure`, { status: response.status })
      return null
    }
    return { status: response.status, data: await response.json() }
  } catch {
    console.error(`${name}: upstream request failed`)
    return null
  }
}
