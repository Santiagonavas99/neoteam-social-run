import { agenda } from '@/features/event/event'

// The rail sits on the centre of the 16 px dot column: time column + gap + 8 px.
export function Agenda({ index = '02' }: { index?: string }) {
  return (
    <section className="bg-neo-bg py-12 md:py-24" id="agenda">
      <div className="shell grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <header className="reveal lg:sticky lg:top-10 lg:self-start">
          <span className="v2-index">{index} / AGENDA</span>
          <h2 className="m-0 mt-3 text-[clamp(40px,11vw,76px)] font-extrabold leading-[0.92] tracking-[-0.06em]">
            UNA MAÑANA
            <br />
            CON RITMO.
          </h2>
          <p className="m-0 mt-4 max-w-[40ch] text-[15px] text-neo-text-secondary">
            Desde la llegada hasta la foto final: correr, recuperar, compartir y celebrar el
            aniversario juntos.
          </p>
        </header>

        <ol className="relative m-0 list-none p-0 before:absolute before:top-3 before:bottom-3 before:left-[71px] before:w-0.5 before:bg-neo-border md:before:left-[95px]">
          {agenda.map((item) => {
            const highlight = 'highlight' in item
            return (
              <li
                key={`${item.time}-${item.title}`}
                className="reveal grid grid-cols-[56px_16px_minmax(0,1fr)] gap-x-2 py-3 md:grid-cols-[72px_16px_minmax(0,1fr)] md:gap-x-4"
              >
                <p className="m-0 text-right text-lg font-extrabold leading-tight tracking-[-0.03em] tabular-nums md:text-2xl">
                  {item.time}
                  <small className="block text-xs font-medium tracking-normal text-neo-text-secondary">
                    {item.meridiem}
                  </small>
                </p>
                <span
                  aria-hidden
                  className={`relative z-10 mt-1.5 size-4 justify-self-center rounded-full border-2 ${
                    highlight
                      ? 'border-neo-accent bg-neo-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--neo-accent)_25%,transparent)]'
                      : 'border-neo-border-strong bg-neo-bg'
                  }`}
                />
                <div className="min-w-0">
                  <h3
                    className={`m-0 text-base font-bold tracking-[-0.02em] md:text-lg ${
                      highlight ? 'text-neo-accent-text' : ''
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className="m-0 mt-1 text-sm leading-snug text-neo-text-secondary">
                    {item.details.join(' ')}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
