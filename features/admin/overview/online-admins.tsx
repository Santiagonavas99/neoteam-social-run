'use client'

import { UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { callAdmin } from '../api'
import { activityLabel, type OnlineAdministrator, PRESENCE_POLL_MS } from './admin-presence'

export function OnlineAdmins() {
  const [rows, setRows] = useState<OnlineAdministrator[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(Date.now())

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

    void refresh()
    const interval = window.setInterval(() => void refresh(), PRESENCE_POLL_MS)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      disposed = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <section aria-labelledby="admin-presence-title" className="rounded-card border border-neo-border bg-neo-surface p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-control bg-neo-accent-soft text-neo-accent-text">
            <UsersRound aria-hidden className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 id="admin-presence-title" className="m-0 text-base font-bold">Administradores conectados</h2>
            <p className="m-0 text-xs text-neo-text-secondary">Solo personal autorizado · actualización automática</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-neo-border px-3 py-1.5">
          <span className="size-2 rounded-full bg-neo-accent" aria-hidden="true" />
          <span className="text-sm font-bold tabular-nums">{loaded && !error ? rows.length : '—'}</span>
          <span className="text-xs text-neo-text-secondary">en línea</span>
        </div>
      </div>

      {!loaded ? (
        <p className="m-0 text-sm text-neo-text-secondary" role="status">Consultando conexiones…</p>
      ) : error ? (
        <p className="m-0 text-sm text-neo-text-secondary" role="status">
          No fue posible actualizar las conexiones. Se reintentará automáticamente.
        </p>
      ) : rows.length === 0 ? (
        <p className="m-0 text-sm text-neo-text-secondary">No hay administradores activos en este momento.</p>
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
          {rows.map((user) => (
            <li key={user.name} className="flex min-w-0 items-center gap-3 rounded-control border border-neo-border bg-neo-bg px-3 py-3">
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-neo-accent-soft font-bold text-neo-accent-text">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-sm font-bold">{user.name}</p>
                <p className="m-0 text-xs text-neo-text-secondary">{activityLabel(user.lastActiveAt, updatedAt)}</p>
              </div>
              <span className="size-2 shrink-0 rounded-full bg-neo-accent" aria-label="Conectado" />
            </li>
          ))}
        </ul>
      )}
      <p className="m-0 mt-3 text-xs text-neo-text-secondary">
        Las conexiones desaparecen automáticamente al cerrar el panel o tras 2 min sin actividad.
      </p>
    </section>
  )
}
