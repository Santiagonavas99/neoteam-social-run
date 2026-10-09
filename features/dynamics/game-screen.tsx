'use client'

import { ArrowLeft, Expand, Play, RotateCcw, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { countdownValue, demoGame, type PublicGame } from './game-state'

function SpectatorContent({ game, now }: { game: PublicGame; now: number }) {
  const count = countdownValue(game.updatedAt, now)
  const isRaffle = game.type === 'raffle'
  const waiting = game.phase === 'ready' || game.phase === 'countdown'

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-7 py-12 text-center md:gap-9">
      <p className="m-0 text-sm font-bold tracking-[0.28em] text-neo-accent uppercase">
        {isRaffle ? 'Sorteo en vivo' : 'Actividad NeoTeam'}
      </p>
      <h1 className="m-0 text-5xl font-black leading-[0.96] tracking-[-0.07em] break-words text-white sm:text-7xl lg:text-9xl">
        {game.name}
      </h1>
      {game.prize && (
        <p className="m-0 text-lg font-medium text-white/75 sm:text-2xl">{game.prize}</p>
      )}
      {isRaffle ? (
        waiting ? (
          <div className="mx-auto mt-6 flex min-h-40 flex-col items-center justify-center gap-4">
            {game.phase === 'countdown' && count > 0 ? (
              <span
                key={count}
                aria-live="assertive"
                className="text-[9rem] font-black leading-none tracking-tighter text-neo-accent motion-safe:animate-pulse sm:text-[13rem]"
              >
                {count}
              </span>
            ) : (
              <>
                <Trophy aria-hidden className="size-16 text-neo-accent sm:size-20" />
                <p className="m-0 text-2xl font-bold text-white sm:text-4xl">
                  {game.phase === 'countdown'
                    ? '¡Que comience el sorteo!'
                    : '¡Pronto conoceremos a los ganadores!'}
                </p>
              </>
            )}
          </div>
        ) : (
          <div aria-live="polite" className="mx-auto mt-5 w-full max-w-4xl space-y-4">
            <p className="m-0 text-sm font-bold tracking-[0.22em] text-neo-accent uppercase">
              {game.phase === 'finished' ? 'Sorteo finalizado' : 'Revelación de ganadores'}
            </p>
            {game.winners.length ? (
              <ol className="m-0 grid list-none gap-3 p-0">
                {game.winners.map((winner) => (
                  <li
                    key={winner.rank}
                    className="rounded-2xl border border-neo-accent/40 bg-neo-accent/10 px-5 py-5 text-2xl font-extrabold break-words text-white shadow-[0_0_40px_rgba(3,248,246,0.08)] sm:text-4xl md:px-8"
                  >
                    <span className="mr-3 text-neo-accent">{winner.rank}.</span>
                    {winner.name}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="m-0 py-16 text-3xl font-bold text-white/90">
                Estamos a punto de conocer al primer ganador…
              </p>
            )}
            <p className="m-0 text-base font-semibold text-white/60">
              {game.winners.length} de {game.winnerCount} ganadores revelados
            </p>
          </div>
        )
      ) : (
        <div className="mx-auto mt-7 rounded-3xl border border-white/20 bg-white/5 p-10 sm:p-14">
          <Users aria-hidden className="mx-auto mb-3 size-14 text-neo-accent" />
          <p className="m-0 text-6xl font-black text-white sm:text-8xl">{game.participations}</p>
          <p className="m-0 mt-2 text-lg font-bold text-white/70">Participaciones registradas</p>
        </div>
      )}
    </section>
  )
}

export function GameScreen({ id, demo }: { id: string; demo: boolean }) {
  const [game, setGame] = useState<PublicGame | null>(null)
  const [failed, setFailed] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [demoCount, setDemoCount] = useState(0)
  const [demoPhase, setDemoPhase] = useState<PublicGame['phase']>('ready')

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/juego/' + id, { cache: 'no-store' })
      if (!response.ok) throw new Error('Game unavailable')
      const value = (await response.json()) as PublicGame
      if (value?.id !== id) throw new Error('Unexpected game')
      setGame(value)
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }, [id])

  useEffect(() => {
    if (demo) return
    void refresh()
    const poll = window.setInterval(() => void refresh(), 2000)
    return () => window.clearInterval(poll)
  }, [demo, refresh])

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(clock)
  }, [])

  const current: PublicGame | null = demo
    ? {
        ...demoGame,
        phase: demoPhase,
        shownCount: demoCount,
        winners: demoPhase === 'ready' ? [] : demoGame.winners.slice(0, demoCount),
      }
    : game

  async function fullscreen() {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen()
    else await document.exitFullscreen()
  }

  return (
    <main className="flex min-h-svh flex-col overflow-hidden bg-neo-black px-5 py-6 font-sans text-white sm:px-10 lg:px-16">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-xs font-bold tracking-[0.2em] uppercase">
          <span className="size-2 rounded-full bg-neo-accent" aria-hidden />
          {demo ? 'Modo ensayo · datos ficticios' : 'NeoTeam · Social Run'}
        </div>
        <div className="flex items-center gap-4">
          {demo && (
            <Link href="/admin" className="text-sm font-bold text-white/70 hover:text-white">
              <ArrowLeft aria-hidden className="mr-1 inline size-4" /> Panel
            </Link>
          )}
          <button
            type="button"
            onClick={() => void fullscreen()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-4 text-sm font-bold text-white hover:bg-white/10"
          >
            <Expand aria-hidden className="size-4" /> Pantalla completa
          </button>
        </div>
      </header>

      {current ? (
        <SpectatorContent game={current} now={now} />
      ) : (
        <section className="grid flex-1 place-items-center text-center">
          <div className="max-w-lg">
            <Trophy aria-hidden className="mx-auto mb-5 size-16 text-neo-accent" />
            <h1 className="text-3xl font-bold">
              {failed ? 'Pantalla no disponible todavía' : 'Preparando la pantalla de juego…'}
            </h1>
            <p className="text-white/60">
              {failed
                ? 'Esta dinámica debe estar activa y el módulo de juego preparado.'
                : 'Conectando con el estado del evento.'}
            </p>
          </div>
        </section>
      )}

      {demo && (
        <nav
          aria-label="Controles de ensayo"
          className="mx-auto mb-3 flex w-full max-w-xl flex-wrap justify-center gap-2 rounded-2xl border border-neo-accent/40 p-4"
        >
          <button
            type="button"
            className="rounded-xl bg-neo-accent px-5 py-3 font-bold text-neo-black"
            onClick={() => {
              setDemoPhase('reveal')
              setDemoCount((count) => Math.min(3, count + 1))
            }}
          >
            <Play aria-hidden className="mr-2 inline size-4" /> Siguiente ganador
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/40 px-5 py-3 font-bold text-white"
            onClick={() => {
              setDemoPhase('ready')
              setDemoCount(0)
            }}
          >
            <RotateCcw aria-hidden className="mr-2 inline size-4" /> Reiniciar ensayo
          </button>
          <p className="m-0 w-full text-center text-xs text-white/50">
            Estos resultados son ficticios. No se guarda nada ni se consume ningún premio.
          </p>
        </nav>
      )}
      <footer className="flex items-center justify-between gap-4 border-t border-white/20 pt-5 text-xs font-bold tracking-[0.13em] text-white/55 uppercase">
        <span>NEOTEAM / SOCIAL RUN</span>
        <span>{demo ? 'Ensayo seguro' : 'En directo · actualización cada 2 segundos'}</span>
      </footer>
    </main>
  )
}
