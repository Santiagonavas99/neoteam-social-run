import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { homeV3Content } from './content'

export function FinalV3() {
  return (
    <section className="v3-final">
      <div className="v3-shell v3-final-grid">
        <p className="v3-section-index">04 / {homeV3Content.final.eyebrow}</p>

        <div className="v3-final-copy">
          <h2>{homeV3Content.final.headline}</h2>
          <div className="v3-final-bottom">
            <strong>{homeV3Content.final.date}</strong>
            <Link href="/registro" className="button v3-final-action">
              Quiero estar ahí <ArrowRight aria-hidden className="size-4 shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
