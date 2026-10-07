import { useEffect, useState } from 'react'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'
import type { StaffRole } from '../types'

export type AdminSession = ReturnType<typeof useAdminSession>

// The session token lives in an httpOnly cookie set by /api/admin; this hook only knows
// whether it is valid and which role it carries.
export function useAdminSession() {
  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [role, setRole] = useState<StaffRole>('checkin')
  const [name, setName] = useState('')
  const [bootError, setBootError] = useState('')

  useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        const validation = await callAdmin('validate')
        if (!active) return
        if (!validation.valid) return
        setRole(validation.role ?? 'checkin')
        setName(validation.name ?? '')
        setSignedIn(true)
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
  function remember(profile: { role?: StaffRole; name?: string }) {
    setRole(profile.role ?? 'checkin')
    setName(profile.name ?? '')
    setSignedIn(true)
  }

  async function signOut() {
    setSignedIn(false)
    setBootError('')
    try {
      await callAdmin('logout')
    } catch {
      // The cookie expires on its own; the panel is already closed on this device.
    }
  }

  return { ready, signedIn, role, name, bootError, remember, signOut }
}
