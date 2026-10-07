import { CalendarDays, Clock, Route } from 'lucide-react'
import { eventConfig } from '@/features/event/event'
import { stagger } from '../stagger'

const facts = [
  { value: '18 OCT', label: 'Fecha', icon: CalendarDays },
  { value: '07:30', label: 'Encuentro', icon: Clock },
  { value: '5K', label: 'Ruta social', icon: Route },
]

export function Story({ index = '01' }: { index?: string }) {
  return (
    <section className="v2-story shell" id="evento">
      <span className="v2-index">{index} / EL PLAN</span>
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
          {facts.map(({ value, label, icon: Icon }, i) => (
            <div className="v2-fact reveal" key={label} style={stagger(i)}>
              <strong>{value}</strong>
              <span className="inline-flex items-center gap-1.5">
                <Icon aria-hidden className="size-3.5 shrink-0" />
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
