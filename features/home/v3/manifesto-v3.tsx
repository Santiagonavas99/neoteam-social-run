import { eventConfig } from '@/features/event/event'
import { homeV3Content } from './content'

export function ManifestoV3() {
  return (
    <section className="v3-manifesto" id="evento-v3">
      <div className="v3-shell v3-manifesto-grid">
        <p className="v3-section-index">01 / {homeV3Content.manifesto.eyebrow}</p>

        <h2>{homeV3Content.manifesto.headline}</h2>

        <div className="v3-manifesto-aside">
          <p>{eventConfig.description}</p>
          <dl className="v3-facts">
            <div>
              <dt>Fecha</dt>
              <dd>18 OCT</dd>
            </div>
            <div>
              <dt>Encuentro</dt>
              <dd>07:30</dd>
            </div>
            <div>
              <dt>Ruta social</dt>
              <dd>5K</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
