import { eventConfig } from '@/features/event/event'

export function Story() {
  return (
    <section className="v2-story shell" id="evento">
      <span className="v2-index">01 / EL PLAN</span>
      <div className="v2-story-copy reveal">
        <p className="section-label">UN PUNTO DE ENCUENTRO</p>
        <h2>
          NO VENIMOS A <em>COMPETIR.</em>
          <br />
          VENIMOS A CORRER JUNTOS.
        </h2>
      </div>
      <div className="v2-story-aside reveal">
        <p>{eventConfig.description}</p>
        <div className="v2-fact-list">
          <div className="v2-fact">
            <strong>18 OCT</strong>
            <span>Fecha</span>
          </div>
          <div className="v2-fact">
            <strong>07:30</strong>
            <span>Encuentro</span>
          </div>
          <div className="v2-fact">
            <strong>5K</strong>
            <span>Ruta social</span>
          </div>
        </div>
      </div>
    </section>
  )
}
