import type { AdminResponse } from './types'

type Endpoint = { url: string; connectionError: string; failure: string }

const adminEndpoint: Endpoint = {
  url: '/api/admin',
  connectionError: 'No pudimos conectar con el panel administrativo. Inténtalo de nuevo.',
  failure: 'No pudimos completar la operación.',
}
const logosEndpoint: Endpoint = {
  url: '/api/admin/logos',
  connectionError: 'No pudimos conectar con el carrusel de logos. Inténtalo de nuevo.',
  failure: 'No pudimos gestionar el carrusel de logos.',
}

// Image uploads are gzip-compressed to stay under Vercel's request body limit;
// the API route inflates them before calling the edge function.
async function post<Row>(endpoint: Endpoint, action: string, payload: Record<string, unknown>) {
  const json = JSON.stringify({ action, ...payload })
  const gzip = action === 'uploadAdminImage'
  const body = gzip
    ? await new Response(
        new Blob([json]).stream().pipeThrough(new CompressionStream('gzip')),
      ).blob()
    : json
  const response = await fetch(endpoint.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(gzip ? { 'Content-Encoding': 'gzip' } : {}),
    },
    body,
  }).catch(() => {
    throw new Error(endpoint.connectionError)
  })
  const data = (await response.json().catch(() => {
    throw new Error(endpoint.connectionError)
  })) as AdminResponse<Row>
  if (!response.ok) throw new Error(data.error || endpoint.failure)
  return data
}

export function callAdmin<Row = never>(action: string, payload: Record<string, unknown> = {}) {
  return post<Row>(adminEndpoint, action, payload)
}

export function callLogos<Row = never>(action: string, payload: Record<string, unknown> = {}) {
  return post<Row>(logosEndpoint, action, payload)
}
