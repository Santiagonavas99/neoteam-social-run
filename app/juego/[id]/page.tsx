import { notFound } from 'next/navigation'
import { GameScreen } from '@/features/dynamics/game-screen'
import { isGameId } from '@/features/dynamics/game-state'

export const dynamic = 'force-dynamic'

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ensayo?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  if (!isGameId(id)) notFound()
  return <GameScreen id={id} demo={query.ensayo === '1'} />
}
