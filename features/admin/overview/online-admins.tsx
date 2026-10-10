'use client'

import { UsersRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { callAdmin } from '../api'
import { activityLabel, type OnlineAdministrator, PRESENCE_POLL_MS } from './admin-presence'

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

export function OnlineAdmins() {
  const [rows, setRows] = useState<OnlineAdministrator[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(Date.now())
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    let disposed = false

    const refresh = async () => {
      if (document.visibilityState === 'hidden') return
      try {
        const response = await callAdmin<OnlineAdministrator>('presenceList')
        if (disposed) return
        setRows(response.online ?? [])
        setError(false)
        setUpdatedAt(Date.now())
      } catch {
        if (disposed) return
        setError(true)
        setRows([])
      } finally {
        if (!disposed) setLoaded(true)
      }
    }

    const outsideClick = (event: PointerEvent) => {
      const details = detailsRef.current
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }

    void refresh()
    const interval = window.setInterval(() => void refresh(), PRESENCE_POLL_MS)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('pointerdown', outsideClick)

    return () => {
      disposed = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('pointerdown', outsideClick)
    }
  }, [])

  const count = loaded && !error ? rows.length : null

  return (
    <details
      ref={detailsRef}
      className="group relative z-20 shrink-0"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && detailsRef.current?.open) {
          detailsRef.current.open = false
          detailsRef.current.querySelector('summary')?.focus()
        }
      }}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-full px-2 outline-none transition-colors hover:bg-neo-muted-bg focus-visible:ring-2 focus-visible:ring-neo-accent-text [&::-webkit-details-marker]:hidden">
        <span className="sr-only">
          Administradores conectados: {count ?? 'consultando'}. Ver detalles
        </span>
        {count !== null && count > 0 ? (
          <span aria-hidden="true" className="flex items-center -space-x-2">
            {rows.slice(0, 4).map((user) => (
              <span
                key={user.id}
                className="relative grid size-9 shrink-0 place-items-center rounded-full border-2 border-neo-bg bg-neo-accent-soft text-[11px] font-extrabold tracking-[-0.025em] text-neo-accent-text shadow-sm"
              >
                {initials(user.name)}
                <span className="absolute right-[-1px] bottom-0 size-2 rounded-full border border-neo-bg bg-neo-accent" />
              </span>
            ))}
            {count > 4 && (
              <span className="relative grid size-9 shrink-0 place-items-center rounded-full border-2 border-neo-bg bg-neo-muted-bg text-[11px] font-bold text-neo-text">
                +{count - 4}
              </span>
            )}
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="relative grid size-9 place-items-center rounded-full border border-neo-border bg-neo-surface text-neo-text-secondary"
          >
            <UsersRound className="size-4" />
            <span
              className={`absolute right-0 bottom-0 size-2 rounded-full border border-neo-bg ${count === 0 ? 'bg-neo-border-strong' : 'bg-neo-warning'}`}
            />
          </span>
        )}
        {count !== null && (
          <span
            aria-hidden="true"
            className="ml-2 hidden text-xs font-semibold text-neo-text-secondary sm:inline"
          >
            {count} en línea
          </span>
        )}
      </summary>

      <div className="absolute top-[calc(100%+10px)] right-0 z-50 w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-card border border-neo-border bg-neo-surface p-3 text-neo-text shadow-xl">
        <div className="flex items-center justify-between gap-2 border-b border-neo-border px-1 pb-3">
          <div>
            <p className="m-0 text-sm font-bold">Administradores conectados</p>
            <p className="m-0 text-xs text-neo-text-secondary">
              {count === null ? 'Sincronizando…' : `${count} en línea · actualización automática`}
            </p>
          </div>
          <span
            className={`size-2 rounded-full ${error ? 'bg-neo-warning' : 'bg-neo-accent'}`}
            aria-hidden="true"
          />
        </div>
        {!loaded ? (
          <p role="status" className="m-0 px-1 py-4 text-sm text-neo-text-secondary">
            Consultando conexiones…
          </p>
        ) : error ? (
          <p role="status" className="m-0 px-1 py-4 text-sm text-neo-text-secondary">
            No se pudo consultar la actividad. Reintentaremos automáticamente.
          </p>
        ) : count === 0 ? (
          <p className="m-0 px-1 py-4 text-sm text-neo-text-secondary">
            No hay administradores activos ahora.
          </p>
        ) : (
          <ul className="m-0 max-h-72 list-none space-y-1 overflow-y-auto p-0">
            {rows.map((user) => (
              <li key={user.id} className="flex items-center gap-3 rounded-control px-1 py-2">
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-neo-accent-soft text-xs font-bold text-neo-accent-text"
                >
                  {initials(user.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-sm font-semibold">{user.name}</p>
                  <p className="m-0 text-xs text-neo-text-secondary">
                    {activityLabel(user.lastActiveAt, updatedAt)}
                  </p>
                </div>
                <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-neo-accent" />
              </li>
            ))}
          </ul>
        )}
        <p className="m-0 border-t border-neo-border px-1 pt-3 text-xs text-neo-text-secondary">
          Se desconectan automáticamente al cerrar o dejar de usar el panel.
        </p>
      </div>
    </details>
  )
}
