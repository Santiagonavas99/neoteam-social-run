import Link from 'next/link'
import type { ReactNode } from 'react'
import { BrandLink } from '@/components/brand-link'

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-neo-bg text-neo-text">
      <header className="bg-neo-black text-neo-white">
        <div className="mx-auto flex min-h-20 w-full max-w-[1100px] items-center justify-between gap-4 px-5 md:px-12">
          <BrandLink />
          <Link
            href="/"
            className="text-sm font-bold text-neo-white underline-offset-4 hover:underline"
          >
            Volver al evento
          </Link>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[960px] px-5 py-10 md:px-12 md:py-16">{children}</div>
      <footer className="mx-auto flex max-w-[960px] flex-wrap gap-x-7 gap-y-3 border-t border-neo-border px-5 py-7 text-sm md:px-12">
        <Link className="underline-offset-4 hover:underline" href="/legal/terminos">
          Condiciones de participación
        </Link>
        <Link className="underline-offset-4 hover:underline" href="/legal/privacidad">
          Tratamiento de datos
        </Link>
        <Link className="underline-offset-4 hover:underline" href="/registro">
          Inscripción
        </Link>
      </footer>
    </main>
  )
}
