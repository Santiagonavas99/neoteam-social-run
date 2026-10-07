import { useEffect, useState } from 'react'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import type { StaffRole } from '../types'

const SESSION_KEY = 'neoteam_admin_pin_session'

export type AdminSession = ReturnType<typeof useAdminSession>

export function useAdminSession() {
  const [ready, setReady] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [role, setRole] = useState<StaffRole>('checkin')
  const [name, setName] = useState('')
  const [bootError, setBootError] = useState('')

  useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        const storedToken = window.localStorage.getItem(SESSION_KEY)
        if (!storedToken) return

        const validation = await callAdmin('validate', { token: storedToken })
        if (!active) return
        if (validation.valid) {
          setRole(validation.role ?? 'checkin')
          setName(validation.name ?? '')
          setToken(storedToken)
        } else window.localStorage.removeItem(SESSION_KEY)
      } catch (error) {
        if (active) setBootError(errorMessage(error, 'No pudimos cargar el acceso administrativo.'))
      } finally {
        if (active) setReady(true)
      }
    }

    void bootstrap()
    return () => {
      active = false
    }
  }, [])

  // Role and name only pick which sections to show; the edge function enforces access.
  function remember(next: string, profile: { role?: StaffRole; name?: string }) {
    window.localStorage.setItem(SESSION_KEY, next)
    setRole(profile.role ?? 'checkin')
    setName(profile.name ?? '')
    setToken(next)
  }

  async function signOut() {
    const current = token
    window.localStorage.removeItem(SESSION_KEY)
    setToken(null)
    setBootError('')
    if (!current) return
    try {
      await callAdmin('logout', { token: current })
    } catch {
      // The local session is already closed even if remote revocation fails.
    }
  }

  return { ready, token, role, name, bootError, remember, signOut }
}
