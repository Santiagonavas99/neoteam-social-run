import { CountUp } from '../count-up'
import { runnersShown } from '../numbers'
import { stagger } from '../stagger'

export function Numbers({ registered, brands }: { registered: number | null; brands: number }) {
  const items = [
    { value: runnersShown(registered), prefix: '+', label: 'Corredores inscritos' },
    brands > 0 ? { value: brands, prefix: '', label: 'Marcas aliadas' } : null,
  ].filter((item) => item !== null)
  if (!items.length) return null

  return (
    <section className="v2-numbers shell" aria-label="El Social Run en números">
      {items.map(({ value, prefix, label }, i) => (
        <div key={label} className="v2-number reveal" style={stagger(i)}>
          <strong>
            <CountUp value={value} prefix={prefix} />
          </strong>
          <span>{label}</span>
        </div>
      ))}
    </section>
  )
}
