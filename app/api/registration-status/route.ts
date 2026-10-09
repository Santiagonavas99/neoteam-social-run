import { getRegistrationSettings } from '@/features/registration/registration-settings'

export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = await getRegistrationSettings()
  return Response.json(settings ?? { error: 'No se pudo consultar el estado del registro.' }, {
    status: settings ? 200 : 503,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
