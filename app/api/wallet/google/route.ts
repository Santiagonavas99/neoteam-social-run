import { googleSaveUrl, googleWalletConfig } from '@/features/registration/google-wallet'
import { passByToken } from '@/features/registration/pass'

export const runtime = 'nodejs'

const FAILED =
  'No pudimos añadir el pase a Google Wallet. Usa la captura de tu QR o inténtalo más tarde.'

const text = (body: string, status: number) =>
  new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })

export async function GET(request: Request) {
  const config = googleWalletConfig(process.env)
  if (!config) return text('Google Wallet no está disponible.', 404)

  const token = new URL(request.url).searchParams.get('token')?.trim().slice(0, 40) ?? ''

  try {
    const pass = await passByToken(token)
    if (!pass) return text('No encontramos este pase.', 404)
    const url = await googleSaveUrl(pass, config)
    return new Response(null, {
      status: 302,
      headers: { Location: url, 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Google Wallet', error instanceof Error ? error.message : 'unknown error')
    return text(FAILED, 502)
  }
}
