import { agenda } from '@/features/event/event'

export function AgendaV3() {
  return (
    <section className="v3-agenda" id="agenda-v3">
      <div className="v3-shell">
        <header className="v3-agenda-head">
          <p className="v3-section-index">02 / AGENDA</p>
          <h2>
            EL DÍA TIENE
            <br />
            SU PROPIO RITMO.
          </h2>
          <p>
            Llegamos, corremos y nos quedamos a celebrar. Esta es la secuencia del aniversario de
            principio a fin.
          </p>
        </header>

        <ol className="v3-agenda-list">
          {agenda.map(({ time, meridiem, title, details }, index) => {
            const emphasis =
              title === 'Ruta 5K' ? ' route' : title === 'Celebración y rifas' ? ' celebration' : ''

            return (
              <li className={`v3-agenda-row${emphasis}`} key={`${time}-${title}`}>
                <span className="v3-agenda-number">{String(index + 1).padStart(2, '0')}</span>
                <time>
                  {time}
                  <small>{meridiem}</small>
                </time>
                <div className="v3-agenda-copy">
                  <h3>{title}</h3>
                  <p>{details.join(' · ')}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
