import { ArrowDown, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { homeV3Content } from './content'

export function AnniversarySplit({ variant }: { variant: 'together' | 'after' }) {
  const isAfter = variant === 'after'
  const content = isAfter ? homeV3Content.afterRoute : homeV3Content.together

  return (
    <section
      className={`v3-split ${isAfter ? 'v3-split--after' : 'v3-split--together'}`}
      aria-labelledby={`v3-split-${variant}-title`}
    >
      <div className="v3-split-media" aria-hidden="true">
        <div className="v3-media-code">{isAfter ? 'POST · 5K' : '18 · 10'}</div>
        <div className="v3-media-track">
          <span />
          <span />
          <span />
        </div>
        <strong>{isAfter ? 'CELEBRA' : 'CORRE'}</strong>
      </div>

      <div className="v3-split-copy">
        <p className="v3-eyebrow">{content.eyebrow}</p>
        <h2 id={`v3-split-${variant}-title`}>{content.headline}</h2>
        <p className="v3-split-body">{content.body}</p>

        {'detail' in content ? <p className="v3-split-detail">{content.detail}</p> : null}

        {isAfter ? (
          <Link className="button v3-split-action" href="/registro">
            Quiero estar ahí <ArrowRight aria-hidden className="size-4 shrink-0" />
          </Link>
        ) : (
          <a className="button v3-split-action" href="#agenda-v3">
            Ver la agenda <ArrowDown aria-hidden className="size-4 shrink-0" />
          </a>
        )}
      </div>
    </section>
  )
}
