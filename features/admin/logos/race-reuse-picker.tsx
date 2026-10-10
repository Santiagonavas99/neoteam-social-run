'use client'

import { ArrowUpRight, Link2, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { LogoItem } from '../types'
import { Logo } from '../ui/admin-ui'

export function RaceReusePicker({
  brands,
  busy,
  loading,
  onToggle,
  onGoToBrands,
}: {
  brands: LogoItem[]
  busy: boolean
  loading: boolean
  onToggle: (brand: LogoItem, enabled: boolean) => Promise<void>
  onGoToBrands: () => void
}) {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const linked = brands.filter((brand) => brand.show_in_races).length
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es')
    return [...brands]
      .filter((brand) => brand.name.toLocaleLowerCase('es').includes(term))
      .sort(
        (a, b) =>
          Number(b.show_in_races) - Number(a.show_in_races) ||
          a.sort_order - b.sort_order ||
          a.name.localeCompare(b.name, 'es'),
      )
  }, [brands, search])
  const visible = showAll || search.trim() ? filtered : filtered.slice(0, 6)

  async function toggle(brand: LogoItem) {
    if (busy || pendingId || (!brand.active && !brand.show_in_races)) return
    setPendingId(brand.id)
    try {
      await onToggle(brand, !brand.show_in_races)
    } finally {
      setPendingId(null)
    }
  }

  return (
    <section
      aria-label="Reutilizar logos de marcas aliadas"
      className="mb-6 rounded-control border border-neo-border bg-neo-surface p-4 md:p-5"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-neo-accent-text">
            <Link2 aria-hidden className="size-4" />
            <span className="text-xs font-bold uppercase tracking-[0.12em]">
              Biblioteca compartida
            </span>
          </div>
          <h3 className="m-0 text-lg font-bold">Usar logos que ya subiste</h3>
          <p className="m-0 mt-1 max-w-[65ch] text-sm text-neo-text-secondary">
            Selecciona una marca para mostrarla también en Carreras aliadas. No se duplica la imagen
            ni el registro; sus cambios se reflejan automáticamente en ambas secciones.
          </p>
        </div>
        <span className="rounded-full bg-neo-muted-bg px-3 py-1.5 text-xs font-semibold text-neo-text">
          {linked} seleccionadas · {brands.length} disponibles
        </span>
      </div>

      <div className="relative mb-4">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neo-text-secondary"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Busca una marca por nombre…"
          aria-label="Buscar un logo de marcas aliadas"
          className="w-full pl-10"
        />
      </div>

      {loading ? (
        <p className="text-sm text-neo-text-secondary" role="status">
          Cargando biblioteca de logos…
        </p>
      ) : brands.length === 0 ? (
        <div className="rounded-xl bg-neo-muted-bg p-4 text-sm">
          Todavía no tienes logos de marcas. Sube uno y podrás reutilizarlo aquí.
          <button type="button" className="text-link ml-2" onClick={onGoToBrands}>
            Ir a Marcas aliadas <ArrowUpRight aria-hidden className="inline size-4" />
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-neo-text-secondary">
          No hay logos que coincidan con esa búsqueda.
        </p>
      ) : (
        <>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((brand) => {
              const selected = brand.show_in_races === true
              const disabled = (!brand.active && !selected) || busy || pendingId !== null
              return (
                <div
                  key={brand.id}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-neo-border bg-neo-bg p-2.5"
                >
                  <Logo url={brand.logo_url} name={brand.name} />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-sm font-semibold" title={brand.name}>
                      {brand.name}
                    </p>
                    <p className="m-0 text-xs text-neo-text-secondary">
                      {brand.active
                        ? selected
                          ? 'Visible en carreras'
                          : 'Disponible'
                        : 'Marca oculta'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={
                      selected
                        ? 'button button-secondary shrink-0 text-xs'
                        : 'button shrink-0 text-xs'
                    }
                    onClick={() => void toggle(brand)}
                    disabled={disabled}
                    aria-pressed={selected}
                    aria-label={`${selected ? 'Quitar' : 'Añadir'} ${brand.name} ${selected ? 'de' : 'a'} Carreras aliadas`}
                    title={
                      !brand.active ? 'Activa primero esta marca en Marcas aliadas' : undefined
                    }
                  >
                    {pendingId === brand.id ? 'Guardando…' : selected ? 'Quitar' : 'Añadir'}
                  </button>
                </div>
              )
            })}
          </div>
          {!showAll && !search.trim() && filtered.length > visible.length && (
            <button type="button" className="text-link mt-4" onClick={() => setShowAll(true)}>
              Ver los {filtered.length} logos disponibles
            </button>
          )}
          {showAll && !search.trim() && filtered.length > 6 && (
            <button type="button" className="text-link mt-4" onClick={() => setShowAll(false)}>
              Mostrar menos
            </button>
          )}
        </>
      )}
      <p className="mb-0 mt-3 text-xs text-neo-text-secondary">
        Si una marca está oculta, actívala primero desde Marcas aliadas. Así evitamos mostrar logos
        que están desactivados.
      </p>
    </section>
  )
}
