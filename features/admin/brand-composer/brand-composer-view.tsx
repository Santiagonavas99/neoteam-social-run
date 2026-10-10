'use client'

import {
  ArrowDown, ArrowUp, Download, ImagePlus, Layers3, RefreshCw, Search, X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { callAdmin, callLogos } from '../api'
import { errorMessage } from '../errors'
import type { CommunityRecord, LogoItem } from '../types'
import { Feedback, Logo } from '../ui/admin-ui'
import { LoadingState } from '../ui/loading-state'
import { useAdminData } from '../ui/use-admin-data'
import {
  compositionFormats,
  compositionLayouts,
  type CompositionFormat,
  type CompositionLayout,
} from './composer-layout'
import { composerBrands, type ComposerBrand } from './composer-library'
import { exportComposition, renderComposition, type ComposerSettings } from './composer-renderer'

type Source = { brands: CommunityRecord[]; logos: LogoItem[] }
const initial: Source = { brands: [], logos: [] }
const MAX_FILE_BYTES = 15 * 1024 * 1024
const supportedMime = new Set(['image/png', 'image/jpeg', 'image/webp'])

function readableSize(count: number) {
  return count === 1 ? '1 marca' : `${count} marcas`
}

export function BrandComposerView() {
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const onError = useCallback(
    (error: unknown) =>
      setFeedback({ kind: 'error', text: errorMessage(error, 'No pudimos cargar las marcas.') }),
    [],
  )
  const load = useCallback(async (): Promise<Source> => {
    const [brands, logos] = await Promise.all([
      callAdmin<CommunityRecord>('adminData', { resource: 'brands', operation: 'list' }),
      callLogos<LogoItem>('list'),
    ])
    return { brands: brands.rows ?? [], logos: logos.rows ?? [] }
  }, [])
  const { data, loading, reload } = useAdminData(load, initial, onError)
  const library = useMemo(() => composerBrands(data.brands, data.logos), [data])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [background, setBackground] = useState<string | null>(null)
  const [backgroundName, setBackgroundName] = useState('')
  const [query, setQuery] = useState('')
  const [format, setFormat] = useState<CompositionFormat>('portrait')
  const [layout, setLayout] = useState<CompositionLayout>('grid')
  const [scale, setScale] = useState(0.92)
  const [overlay, setOverlay] = useState(0.15)
  const [tiles, setTiles] = useState(true)
  const [title, setTitle] = useState('')
  const [mime, setMime] = useState<'image/png' | 'image/jpeg'>('image/png')
  const [rendering, setRendering] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [missing, setMissing] = useState<string[]>([])
  const previewRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef(0)

  // Uploaded files never leave the browser. Replace and revoke object URLs promptly.
  useEffect(() => () => {
    if (background) URL.revokeObjectURL(background)
  }, [background])
  useEffect(() => () => {
    for (const url of Object.values(overrides)) URL.revokeObjectURL(url)
  }, [overrides])

  const chosen = useMemo(
    () => selectedIds
      .map((id) => library.find((brand) => brand.id === id))
      .filter((brand): brand is ComposerBrand => Boolean(brand))
      .map((brand) => ({ ...brand, src: overrides[brand.id] ?? brand.src })),
    [library, overrides, selectedIds],
  )
  const chosenIds = useMemo(() => new Set(selectedIds), [selectedIds])
  const available = useMemo(() => library.filter((brand) =>
    brand.name.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')),
  ), [library, query])
  const settings = useMemo<ComposerSettings>(() => ({
    format, layout, scale, overlay, tiles, title, backgroundUrl: background, brands: chosen,
  }), [format, layout, scale, overlay, tiles, title, background, chosen])
  const output = compositionFormats[format]

  useEffect(() => {
    const token = ++requestRef.current
    let mounted = true
    const frame = document.createElement('canvas')
    setRendering(true)
    void renderComposition(frame, settings)
      .then((errors) => {
        if (!mounted || token !== requestRef.current) return
        const canvas = previewRef.current
        if (!canvas) return
        canvas.width = frame.width
        canvas.height = frame.height
        const context = canvas.getContext('2d')
        if (context) context.drawImage(frame, 0, 0)
        setMissing(errors)
      })
      .catch((error: unknown) => {
        if (mounted && token === requestRef.current) {
          setMissing(['Imagen de fondo'])
          setFeedback({
            kind: 'error',
            text: errorMessage(error, 'No se pudo dibujar la vista previa.'),
          })
        }
      })
      .finally(() => {
        if (mounted && token === requestRef.current) setRendering(false)
      })
    return () => {
      mounted = false
    }
  }, [settings])

  function toggle(id: string) {
    setSelectedIds((previous) => previous.includes(id)
      ? previous.filter((value) => value !== id)
      : [...previous, id])
  }

  function reorder(id: string, amount: -1 | 1) {
    setSelectedIds((previous) => {
      const index = previous.indexOf(id)
      const next = index + amount
      if (index < 0 || next < 0 || next >= previous.length) return previous
      const result = [...previous]
      ;[result[index], result[next]] = [result[next], result[index]]
      return result
    })
  }

  function fileValid(file: File) {
    if (!supportedMime.has(file.type)) {
      setFeedback({ kind: 'error', text: 'Selecciona una imagen PNG, JPG o WebP.' })
      return false
    }
    if (!file.size || file.size > MAX_FILE_BYTES) {
      setFeedback({ kind: 'error', text: 'La imagen debe pesar menos de 15 MB.' })
      return false
    }
    return true
  }

  function changeBackground(file?: File) {
    if (!file || !fileValid(file)) return
    setFeedback(null)
    setBackground(URL.createObjectURL(file))
    setBackgroundName(file.name)
  }

  function overrideLogo(id: string, file?: File) {
    if (!file || !fileValid(file)) return
    setFeedback(null)
    setOverrides((previous) => ({ ...previous, [id]: URL.createObjectURL(file) }))
  }

  async function download() {
    if (!chosen.length || exporting) return
    setExporting(true)
    setFeedback(null)
    try {
      const canvas = document.createElement('canvas')
      const errors = await renderComposition(canvas, settings)
      if (errors.length) {
        throw new Error(`No se pudieron cargar: ${errors.join(', ')}. Puedes reemplazar esos logos con PNG/JPG desde la lista de marcas.`)
      }
      const blob = await exportComposition(canvas, mime)
      const fileUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = fileUrl
      anchor.download = `neoteam-marcas-aliadas-${format}.${mime === 'image/png' ? 'png' : 'jpg'}`
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 30_000)
      setFeedback({ kind: 'success', text: `Imagen exportada: ${output.width} × ${output.height} píxeles.` })
    } catch (error) {
      onError(error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="flex min-w-0 flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-bold tracking-[0.16em] text-neo-accent-text uppercase">
            NeoTeam · Estudio creativo
          </p>
          <h2 className="m-0 mt-1 text-2xl font-black tracking-tight">Compositor de marcas aliadas</h2>
          <p className="m-0 mt-2 max-w-[65ch] text-sm text-neo-text-secondary">
            Combina una imagen de fondo con los logos que ya aparecen en la web.
            Previsualiza y exporta una pieza lista para compartir, sin modificar el carrusel.
          </p>
        </div>
        <button type="button" className="button button-secondary" onClick={() => void reload()} disabled={loading}>
          <RefreshCw aria-hidden className="size-4" /> Actualizar logos
        </button>
      </header>

      <Feedback value={feedback} />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(320px,0.87fr)_minmax(0,1.13fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="rounded-card border border-neo-border bg-neo-surface p-5">
            <h3 className="m-0 text-base font-bold">01 · Fondo y formato</h3>
            <p className="m-0 mt-1 text-xs text-neo-text-secondary">
              Selecciona una foto base o utiliza el fondo NeoTeam predeterminado.
            </p>
            <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-control border border-dashed border-neo-border-strong px-3 py-3 text-sm font-semibold hover:bg-neo-muted-bg">
              <ImagePlus aria-hidden className="size-4" />
              {background ? 'Cambiar imagen base' : 'Subir imagen base'}
              <input
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  changeBackground(event.currentTarget.files?.[0])
                  event.currentTarget.value = ''
                }}
              />
            </label>
            {background && (
              <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0 truncate text-neo-text-secondary">{backgroundName}</span>
                <button type="button" className="text-link" onClick={() => {
                  setBackground(null)
                  setBackgroundName('')
                }}>
                  <X aria-hidden className="size-3.5" /> Quitar
                </button>
              </div>
            )}
            <label className="mt-4 block text-sm font-semibold">
              Formato de salida
              <select value={format} onChange={(event) => setFormat(event.target.value as CompositionFormat)}>
                {Object.entries(compositionFormats).map(([key, item]) => (
                  <option key={key} value={key}>{item.label} · {item.width} × {item.height}</option>
                ))}
              </select>
            </label>
          </section>

          <section className="rounded-card border border-neo-border bg-neo-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="m-0 text-base font-bold">02 · Elegir marcas</h3>
                <p className="m-0 mt-1 text-xs text-neo-text-secondary">
                  {readableSize(chosen.length)} en la composición
                </p>
              </div>
              <button
                type="button"
                className="text-link text-xs"
                onClick={() => setSelectedIds(library.map((brand) => brand.id))}
                disabled={loading || !library.length}
              >
                Añadir todas
              </button>
            </div>
            <label className="mt-3 flex items-center gap-2 rounded-control border border-neo-border px-3">
              <Search aria-hidden className="size-4 shrink-0 text-neo-text-secondary" />
              <input
                type="search"
                className="min-w-0 flex-1 border-0! bg-transparent! p-2!"
                placeholder="Buscar una marca…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            {loading ? (
              <LoadingState>Cargando biblioteca…</LoadingState>
            ) : !library.length ? (
              <p className="mt-3 text-sm text-neo-text-secondary">
                Todavía no hay logos de marcas publicados. Añádelos primero en Marcas o Carrusel logos.
              </p>
            ) : (
              <div className="mt-3 max-h-76 overflow-y-auto rounded-control border border-neo-border">
                {available.map((brand) => (
                  <label key={brand.id} className="flex cursor-pointer items-center gap-3 border-b border-neo-border px-3 py-2 last:border-b-0 hover:bg-neo-muted-bg">
                    <input
                      type="checkbox"
                      className="size-4 shrink-0"
                      checked={chosenIds.has(brand.id)}
                      onChange={() => toggle(brand.id)}
                    />
                    <Logo url={brand.src} name={brand.name} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{brand.name}</span>
                  </label>
                ))}
                {!available.length && <p className="p-3 text-sm text-neo-text-secondary">Sin coincidencias.</p>}
              </div>
            )}
            {chosen.length > 0 && (
              <details className="mt-4 rounded-control bg-neo-muted-bg p-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  Orden y reemplazo de logos ({chosen.length})
                </summary>
                <ol className="mt-3 grid gap-2">
                  {chosen.map((brand, index) => (
                    <li key={brand.id} className="flex min-w-0 items-center gap-2 rounded-control bg-neo-surface px-2 py-1.5">
                      <span className="w-5 text-xs text-neo-text-secondary">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold">{brand.name}</span>
                      <label className="cursor-pointer text-xs font-medium text-neo-accent-text">
                        {overrides[brand.id] ? 'Logo local' : 'Reemplazar'}
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => {
                            overrideLogo(brand.id, event.currentTarget.files?.[0])
                            event.currentTarget.value = ''
                          }}
                        />
                      </label>
                      <button aria-label={`Subir ${brand.name}`} type="button" disabled={index === 0} onClick={() => reorder(brand.id, -1)} className="p-1 disabled:opacity-30">
                        <ArrowUp aria-hidden className="size-4" />
                      </button>
                      <button aria-label={`Bajar ${brand.name}`} type="button" disabled={index === chosen.length - 1} onClick={() => reorder(brand.id, 1)} className="p-1 disabled:opacity-30">
                        <ArrowDown aria-hidden className="size-4" />
                      </button>
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </section>

          <section className="rounded-card border border-neo-border bg-neo-surface p-5">
            <h3 className="m-0 text-base font-bold">03 · Composición</h3>
            <div className="mt-4 grid gap-4">
              <label className="block text-sm font-semibold">
                Distribución
                <select value={layout} onChange={(event) => setLayout(event.target.value as CompositionLayout)}>
                  {Object.entries(compositionLayouts).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Tamaño de los logos · {Math.round(scale * 100)} %
                <input
                  className="mt-2 w-full accent-neo-accent-text"
                  type="range" min="0.55" max="1" step="0.05"
                  value={scale}
                  onChange={(event) => setScale(Number(event.target.value))}
                />
              </label>
              <label className="block text-sm font-semibold">
                Oscurecer imagen base · {Math.round(overlay * 100)} %
                <input
                  className="mt-2 w-full accent-neo-accent-text"
                  type="range" min="0" max="0.65" step="0.05"
                  value={overlay}
                  onChange={(event) => setOverlay(Number(event.target.value))}
                />
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input className="size-4" type="checkbox" checked={tiles} onChange={(event) => setTiles(event.target.checked)} />
                Tarjetas blancas detrás de los logos
              </label>
              <label className="block text-sm font-semibold">
                Titular opcional
                <input maxLength={48} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. MARCAS ALIADAS" />
              </label>
            </div>
          </section>
        </div>

        <section className="flex min-w-0 flex-col gap-4 self-start rounded-card border border-neo-border bg-neo-surface p-4 lg:p-5 xl:sticky xl:top-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="m-0 flex items-center gap-2 text-base font-bold">
                <Layers3 aria-hidden className="size-4 text-neo-accent-text" />
                Vista previa
              </h3>
              <p className="m-0 mt-1 text-xs text-neo-text-secondary">
                {output.width} × {output.height} px · {readableSize(chosen.length)}
              </p>
            </div>
            <span className="rounded-full bg-neo-muted-bg px-2.5 py-1 text-xs font-semibold text-neo-text-secondary">
              {rendering ? 'Actualizando…' : 'Lista'}
            </span>
          </div>
          <div className="grid min-w-0 place-items-center overflow-hidden rounded-control bg-[#111919] p-2 sm:p-4">
            <canvas
              ref={previewRef}
              role="img"
              aria-label="Vista previa de la composición con el fondo y las marcas elegidas"
              className="block h-auto w-auto max-w-full rounded-sm shadow-xl"
              style={{ maxHeight: 'min(62vh, 720px)', aspectRatio: `${output.width} / ${output.height}` }}
              width={output.width}
              height={output.height}
            />
          </div>
          {missing.length > 0 && (
            <p role="status" className="m-0 text-xs text-neo-danger">
              No se pudieron cargar estos archivos: {missing.join(', ')}.
              Reemplázalos desde «Orden y reemplazo de logos» antes de exportar.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <label className="min-w-32 flex-1 text-sm font-semibold">
              Archivo
              <select value={mime} onChange={(event) => setMime(event.target.value as 'image/png' | 'image/jpeg')}>
                <option value="image/png">PNG · alta calidad</option>
                <option value="image/jpeg">JPG · liviano</option>
              </select>
            </label>
            <button
              type="button"
              className="button mt-auto min-h-12 flex-2 justify-center"
              disabled={!chosen.length || loading || rendering || exporting || missing.length > 0}
              onClick={() => void download()}
            >
              <Download aria-hidden className="size-4" />
              {exporting ? 'Generando archivo…' : 'Exportar imagen'}
            </button>
          </div>
          <p className="m-0 text-xs leading-relaxed text-neo-text-secondary">
            Tu fondo y los cambios de esta composición permanecen en este navegador.
            Exportar no modifica los logos publicados en NeoTeam.
          </p>
        </section>
      </div>
    </section>
  )
}
