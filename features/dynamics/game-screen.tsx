'use client'

import { Expand, RotateCcw, Trophy, Users } from 'lucide-react'
import { type CSSProperties, useCallback, useEffect, useState } from 'react'
import { canAdvanceDemo, gameScene, type GameScene } from './game-scene'
import { demoGame, type PublicGame } from './game-state'
import styles from './game-screen.module.css'

const CONFETTI = Array.from({ length: 30 }, (_, index) => ({
  left: `${(index * 37 + 11) % 100}%`,
  speed: `${2400 + ((index * 173) % 1500)}ms`,
  delay: `${(index * 109) % 900}ms`,
  tilt: `${(index * 47) % 180}deg`,
  shade: index % 3 === 0 ? '#ffffff' : index % 3 === 1 ? '#03f8f6' : '#a3ffff',
}))

function Confetti({ id }: { id: string }) {
  return (
    <div className={styles.particles} key={id} aria-hidden="true">
      {CONFETTI.map((piece, index) => (
        <i
          key={index}
          className={styles.particle}
          style={
            {
              '--left': piece.left,
              '--speed': piece.speed,
              '--delay': piece.delay,
              '--tilt': piece.tilt,
              '--shade': piece.shade,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

function SlotNumbers() {
  // Abstract glyphs only: no participant names are sent to the suspense effect.
  return (
    <div className={styles.slot} aria-hidden="true">
      <span>?</span>
      <span>?</span>
      <span>?</span>
      <span>?</span>
    </div>
  )
}

function WinnerHistory({ winners }: { winners: PublicGame['winners'] }) {
  if (winners.length === 0) return null
  return (
    <div className={styles.history}>
      <span className={styles.historyTag}>Ya celebramos a</span>
      {winners.map((winner) => (
        <span className={styles.historyWinner} key={winner.rank}>
          {winner.rank}. {winner.name}
        </span>
      ))}
    </div>
  )
}

function RaffleScene({ scene, game }: { scene: GameScene; game: PublicGame }) {
  if (scene.kind === 'activity') return null

  if (scene.kind === 'ready') {
    return (
      <div className={styles.scene}>
        <p className={styles.stageLabel}>La suerte está por decidirse</p>
        <h2 className={styles.heroText}>¿QUIÉN <span className={styles.heroAccent}>GANA?</span></h2>
        <p className={styles.subcopy}>Atentos… el próximo ganador podría estar aquí.</p>
      </div>
    )
  }

  if (scene.kind === 'countdown') {
    return (
      <div className={styles.scene}>
        <p className={styles.stageLabel}>Todo se decide en</p>
        <span
          key={scene.remaining}
          className={styles.countNumber}
          aria-label={`${scene.remaining}`}
        >
          {scene.remaining}
        </span>
        <div className={styles.countBar} aria-hidden="true" />
      </div>
    )
  }

  if (scene.kind === 'anticipation' || scene.kind === 'drawn') {
    return (
      <div className={styles.scene}>
        <p className={styles.suspenseTag}>
          {scene.kind === 'anticipation' ? 'La suerte está en juego' : 'Ya tenemos ganadores'}
        </p>
        <h2 className={styles.heroText}>
          {scene.kind === 'anticipation' ? 'ATENTOS' : '¿LISTOS?'}
          <span className={styles.heroAccent}>.</span>
        </h2>
        <p className={styles.subcopy}>
          {scene.kind === 'anticipation'
            ? 'Que nadie quite los ojos de la pantalla.'
            : 'Ha llegado el momento de revelar el primer nombre.'}
        </p>
      </div>
    )
  }

  if (scene.kind === 'suspense') {
    return (
      <div className={styles.scene} key={`suspense-${scene.rank}-${game.updatedAt}`}>
        <p className={styles.suspenseTag}>Ganador #{scene.rank}</p>
        <h2 className={styles.heroText}>
          Y EL <span className={styles.heroAccent}>GANADOR</span> ES…
        </h2>
        <SlotNumbers />
        <p className={styles.subcopy}>Esto se puso bueno…</p>
        <WinnerHistory winners={scene.previous} />
      </div>
    )
  }

  if (scene.kind === 'winner') {
    return (
      <div className={styles.scene} key={`winner-${scene.winner.rank}-${game.updatedAt}`}>
        <div className={styles.winnerHalo} aria-hidden="true" />
        <Confetti id={`${scene.winner.rank}-${game.updatedAt}`} />
        <p className={styles.stageLabel}>¡Tenemos ganador!</p>
        <h2 className={styles.winnerTitle}>GANADOR #{scene.winner.rank}</h2>
        <p className={styles.winnerName} aria-live="polite">{scene.winner.name}</p>
        <p className={styles.progress}>{game.shownCount} de {game.winnerCount} revelados</p>
        <WinnerHistory winners={scene.previous} />
      </div>
    )
  }

  return (
    <div className={styles.scene}>
      <p className={styles.stageLabel}>¡Gracias por participar!</p>
      <h2 className={styles.heroText}>
        ¡UNA <span className={styles.heroAccent}>LOCURA!</span>
      </h2>
      <p className={styles.subcopy}>Estos son los ganadores del sorteo.</p>
      <ol className={styles.finalList}>
        {scene.winners.map((winner) => (
          <li key={winner.rank} className={styles.finalWinner}>
            <strong>#{winner.rank}</strong>
            {winner.name}
          </li>
        ))}
      </ol>
    </div>
  )
}

function SpectatorContent({ game, now }: { game: PublicGame; now: number }) {
  const scene = gameScene(game, now)

  return (
    <section className={styles.main}>
      <p className={styles.kicker}>
        {game.type === 'raffle' ? 'Sorteo en vivo' : 'Activación NeoTeam'}
      </p>
      <h1 className={styles.eventName}>{game.name}</h1>
      {game.prize && <p className={styles.prize}>{game.prize}</p>}
      {scene.kind === 'activity' ? (
        <div className={styles.scene}>
          <Users aria-hidden="true" size={55} color="#03f8f6" />
          <strong className={styles.heroText}>{game.participations}</strong>
          <p className={styles.subcopy}>Participaciones registradas</p>
        </div>
      ) : (
        <RaffleScene game={game} scene={scene} />
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
  const [demoUpdatedAt, setDemoUpdatedAt] = useState(() => Date.now())

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/juego/${id}`, { cache: 'no-store' })
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
    const clock = window.setInterval(() => setNow(Date.now()), 80)
    return () => window.clearInterval(clock)
  }, [])

  // The rehearsal is entirely local. It does not fetch or write real game data.
  const rehearsalPhase =
    demoPhase === 'countdown' && now - demoUpdatedAt >= 3200 ? 'reveal' : demoPhase
  const current: PublicGame | null = demo
    ? {
        ...demoGame,
        phase: rehearsalPhase,
        shownCount: demoCount,
        updatedAt: new Date(demoUpdatedAt).toISOString(),
        winners: demoGame.winners.slice(0, demoCount),
      }
    : game
  const demoCanAdvance = current ? canAdvanceDemo(current, now) : false

  function startOrAdvanceDemo() {
    if (!demo || !current || !demoCanAdvance) return
    const stamp = Date.now()
    if (rehearsalPhase === 'ready') {
      setDemoPhase('countdown')
    } else if (rehearsalPhase === 'reveal' && demoCount < demoGame.winnerCount) {
      setDemoPhase('reveal')
      setDemoCount((count) => Math.min(demoGame.winnerCount, count + 1))
    } else if (rehearsalPhase === 'reveal') {
      setDemoPhase('finished')
    } else if (rehearsalPhase === 'finished') {
      setDemoPhase('ready')
      setDemoCount(0)
    }
    setDemoUpdatedAt(stamp)
    setNow(stamp)
  }

  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      // Fullscreen is optional; the stage remains fully usable if the browser blocks it.
    }
  }

  const demoLabel =
    rehearsalPhase === 'ready'
      ? 'Iniciar el show'
      : rehearsalPhase === 'countdown'
        ? '¡Cuenta atrás!'
        : rehearsalPhase === 'finished'
          ? 'Repetir ensayo'
          : demoCount < demoGame.winnerCount
            ? `Revelar ganador ${demoCount + 1}`
            : 'Finalizar ensayo'

  return (
    <main className={styles.stage}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.liveDot} aria-hidden="true" />
          NEOTEAM / SOCIAL RUN
          {demo && <span className={styles.demoTag}>· ENSAYO</span>}
        </div>
        <button type="button" className={styles.fullscreen} onClick={() => void fullscreen()}>
          <Expand aria-hidden="true" size={15} />
          Pantalla completa
        </button>
      </header>

      {current ? (
        <SpectatorContent game={current} now={now} />
      ) : (
        <section className={styles.main} role="status">
          <Trophy aria-hidden="true" size={60} color="#03f8f6" />
          <h1 className={styles.eventName}>
            {failed ? 'Pantalla no disponible todavía' : 'Preparando el espectáculo…'}
          </h1>
          <p className={styles.subcopy}>
            {failed
              ? 'Activa esta dinámica y comprueba la conexión del servicio de juego.'
              : 'Conectando con el evento.'}
          </p>
        </section>
      )}

      {demo && (
        <nav className={styles.demoBar} aria-label="Controles de ensayo">
          <button
            type="button"
            className={styles.demoPrimary}
            disabled={!demoCanAdvance}
            onClick={startOrAdvanceDemo}
          >
            {demoLabel}
          </button>
          {rehearsalPhase !== 'ready' && (
            <button
              type="button"
              className={styles.demoSecondary}
              onClick={() => {
                const stamp = Date.now()
                setDemoPhase('ready')
                setDemoCount(0)
                setDemoUpdatedAt(stamp)
                setNow(stamp)
              }}
            >
              <RotateCcw aria-hidden="true" size={13} /> Reiniciar
            </button>
          )}
        </nav>
      )}

      <footer className={styles.footer}>
        <span>18 · 10 · 2026</span>
        <span>{demo ? 'Simulación · sin ganadores reales' : 'Pantalla en vivo'}</span>
      </footer>
    </main>
  )
}
