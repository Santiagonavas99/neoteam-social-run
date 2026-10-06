import type { Pass } from './pass'

export function PassCard({ pass }: { pass: Pass }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 text-center">
      {/* biome-ignore lint/performance/noImgElement: a data URL gains nothing from next/image */}
      <img
        src={pass.qr}
        alt={`Código QR de check-in ${pass.code}`}
        width={260}
        height={260}
        className="size-[260px] max-w-full rounded-card border border-neo-border bg-neo-white"
      />
      {pass.name ? <p className="m-0 text-lg font-bold text-neo-text">{pass.name}</p> : null}
      <p className="m-0 rounded-control border border-dashed border-neo-accent bg-neo-bg px-4 py-2 text-2xl font-bold tracking-wide text-neo-text">
        {pass.code}
      </p>
      <p className="m-0 text-sm leading-normal text-neo-text-secondary">
        Toma una captura de pantalla: es tu entrada para el check-in.
      </p>
    </div>
  )
}
