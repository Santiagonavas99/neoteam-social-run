import { agenda } from '@/features/event/event'

export function Agenda() {
  return (
    <section className="v2-agenda" id="agenda">
      <div className="shell">
        <header className="v2-section-head">
          <span className="v2-index">02 / AGENDA</span>
          <h2>
            UNA MAÑANA
            <br />
            CON RITMO.
          </h2>
          <p>
            Desde la llegada hasta la foto final: correr, recuperar, compartir y celebrar el
            aniversario juntos.
          </p>
        </header>

        <div className="v2-agenda-grid">
          {agenda.map(({ time, meridiem, title, details }, index) => {
            const specialClass =
              title === 'Ruta 5K' ? ' route' : title === 'Celebración y rifas' ? ' celebration' : ''
            return (
              <article className={`v2-agenda-card${specialClass}`} key={`${time}-${title}`}>
                <div className="v2-agenda-top">
                  <div className="v2-agenda-time">
                    {time}
                    <small>{meridiem}</small>
                  </div>
                  <span className="v2-agenda-number">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3>{title}</h3>
                <ul>
                  {details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
