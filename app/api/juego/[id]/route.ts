import { isGameId } from '@/features/dynamics/game-state'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!isGameId(id)) return Response.json({ error: 'Dinámica inválida.' }, { status: 400 })
  try {
    const { data, error } = await createServerSupabaseClient().rpc('public_dynamic_game', {
      p_dynamic_id: id,
    })
    if (error) throw error
    return Response.json(data ?? { error: 'Esta dinámica no está disponible.' }, {
      status: data ? 200 : 404,
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    })
  } catch (error) {
    console.error('game_status_error', error instanceof Error ? error.message : 'unknown')
    return Response.json(
      { error: 'Pantalla de juego temporalmente no disponible.' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  }
}
