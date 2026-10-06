import { useEffect, useState } from 'react'
import { callAdmin } from '../api'
import { errorMessage } from '../errors'

const SESSION_KEY = 'neoteam_admin_pin_session'

export type AdminSession = ReturnType<typeof useAdminSession>

export function useAdminSession() {
  const [ready, setReady] = useState(false)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [setupSecretReady, setSetupSecretReady] = useState<boolean | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [bootError, setBootError] = useState('')

  useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        const status = await callAdmin('status')
        if (!active) return
        setConfigured(Boolean(status.configured))
        setSetupSecretReady(status.setupSecretReady ?? null)

        const storedToken = window.localStorage.getItem(SESSION_KEY)
        if (!storedToken) return

        const validation = await callAdmin('validate', { token: storedToken })
        if (!active) return
        if (validation.valid) setToken(storedToken)
        else window.localStorage.removeItem(SESSION_KEY)
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

  function remember(next: string) {
    window.localStorage.setItem(SESSION_KEY, next)
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

  return {
    ready,
    configured,
    setupSecretReady,
    token,
    bootError,
    remember,
    markConfigured: () => setConfigured(true),
    signOut,
  }
}
