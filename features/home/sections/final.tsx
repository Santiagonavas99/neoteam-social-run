import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function Final() {
  return (
    <section className="v2-final">
      <div className="shell v2-final-grid">
        <span className="v2-index">05 / NOS VEMOS</span>
        <div className="v2-final-main">
          <p>DOMINGO · SOCIAL RUN · ANIVERSARIO NEOTEAM</p>
          <h2>18.10.26</h2>
          <Link href="/registro" className="button">
            Quiero estar ahí <ArrowRight aria-hidden className="size-4 shrink-0" />
          </Link>
        </div>
      </div>
    </section>
  )
}
