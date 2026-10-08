'use client'

import { useEffect, useState } from 'react'
import { agenda, eventConfig } from '@/features/event/event'
import styles from './agenda.module.css'

type LiveAgenda = {
  current: number
  next: number
  ended: boolean
}

const eventDate = eventConfig.startsAt.slice(0, 10)
const eventEndMinutes = minutesFromTime(eventConfig.endsAt.slice(11, 16))

function minutesFromTime(time: string) {
  const [hour = '0', minute = '0'] = time.split(':')
  return Number(hour) * 60 + Number(minute)
}

// The status is based on the published schedule in the event's time zone, not on the
// visitor's computer time zone. It intentionally does not claim to track live activities.
function getLiveAgenda(now: Date): LiveAgenda | null {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const date = [values.year, values.month, values.day].join('-')
  if (date !== eventDate) return null

  const minutes = Number(values.hour) * 60 + Number(values.minute)
  let current = -1

  for (const [index, item] of agenda.entries()) {
    if (minutes >= minutesFromTime(item.time)) current = index
  }

  return {
    current,
    next: current + 1 < agenda.length ? current + 1 : -1,
    ended: minutes >= eventEndMinutes,
  }
}

export function Agenda({ index = '02' }: { index?: string }) {
  const [live, setLive] = useState<LiveAgenda | null>(null)

  useEffect(() => {
    const update = () => setLive(getLiveAgenda(new Date()))
    update()
    const interval = window.setInterval(update, 30_000)
    return () => window.clearInterval(interval)
  }, [])

  const featuredIndex = live && !live.ended ? Math.max(0, live.current) : 2

  return (
    <section className={styles.section} id="agenda">
      <div className={['shell', styles.grid].join(' ')}>
        <header className={styles.heading}>
          <span className="v2-index">{index} / AGENDA</span>
          <span className={styles.eyebrow}>EL DÍA QUE NOS ENCONTRAMOS</span>
          <h2 className={styles.title}>
            <span>UN DÍA.</span>
            <span>MUCHAS</span>
            <span>
              <em>HISTORIAS.</em>
            </span>
          </h2>
          <p className={styles.description}>
            Una mañana para correr, conectar y celebrar juntos. Sigue cada momento del aniversario,
            desde la primera bienvenida hasta la última foto.
          </p>
          <div className={styles.eventMark}>
            <span className={styles.eventDay}>18</span>
            <div className={styles.eventMeta}>
              <span>OCT / DOMINGO</span>
              <span>2026 · CALI, COLOMBIA</span>
            </div>
          </div>
        </header>

        <div className={styles.board}>
          <div className={styles.boardTop}>
            <div className={styles.boardDate}>
              <strong>5K</strong>
              <span>RUTA SOCIAL</span>
            </div>
            <span className={styles.boardCount}>
              {String(agenda.length).padStart(2, '0')} ACTIVIDADES
              <br />
              07:30 — 11:00
            </span>
          </div>

          <div className={styles.timeline}>
            <ol className={styles.list}>
              {agenda.map((item, itemIndex) => {
                const isFeatured = itemIndex === featuredIndex
                const isCurrent = Boolean(live && !live.ended && live.current === itemIndex)
                const isNext = Boolean(live && !live.ended && live.next === itemIndex)
                const isPast = Boolean(
                  live && (live.ended || (live.current >= 0 && itemIndex < live.current)),
                )
                const isKeyMoment = 'highlight' in item
                const extraDetails = item.details.slice(1)
                const status = isCurrent
                  ? 'AHORA · SEGÚN AGENDA'
                  : isNext
                    ? 'SIGUE'
                    : isPast
                      ? 'FINALIZADO'
                      : isFeatured
                        ? 'MOMENTO CLAVE'
                        : isKeyMoment
                          ? 'ESPECIAL'
                          : null

                return (
                  <li
                    key={[item.time, item.title].join('-')}
                    className={styles.step}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <span
                      className={[
                        styles.marker,
                        isFeatured ? styles.featuredMarker : '',
                        isPast ? styles.finishedMarker : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-hidden="true"
                    />
                    <article
                      className={[styles.card, isFeatured ? styles.featuredCard : '']
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.cardTitleGroup}>
                          <span className={styles.sequence}>
                            {String(itemIndex + 1).padStart(2, '0')} / ACTIVIDAD
                          </span>
                          <h3 className={styles.cardTitle}>{item.title}</h3>
                        </div>
                        <time className={styles.time} dateTime={item.time.padStart(5, '0')}>
                          <strong>{item.time}</strong>
                          <small>{item.meridiem.includes('aprox.') ? 'AM · APROX.' : 'AM'}</small>
                        </time>
                      </div>

                      <p className={styles.summary}>{item.details[0]}</p>

                      {status ? (
                        <div className={styles.badgeRow}>
                          <span className={styles.status}>{status}</span>
                        </div>
                      ) : null}

                      {extraDetails.length > 0 ? (
                        <details className={styles.more}>
                          <summary>Ver detalles</summary>
                          <ul>
                            {extraDetails.map((detail) => (
                              <li key={detail}>{detail}</li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </article>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
