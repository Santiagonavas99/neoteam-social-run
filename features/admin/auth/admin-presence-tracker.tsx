'use client'

import { useEffect } from 'react'
import { callAdmin } from '../api'
import { PRESENCE_HEARTBEAT_MS, PRESENCE_IDLE_MS } from '../overview/admin-presence'

/**
 * Tracks authenticated administrators only. A unique UUID per tab prevents
 * a closed tab from marking another tab of the same account offline.
 */
export function AdminPresenceTracker() {
  useEffect(() => {
    const tabId = crypto.randomUUID()
    let lastInteraction = Date.now()
    let lastReportedInteraction = 0
    let disposed = false

    const recordActivity = () => {
      lastInteraction = Date.now()
    }

    const ping = async (justReturned = false) => {
      if (disposed || document.visibilityState !== 'visible') return
      if (Date.now() - lastInteraction >= PRESENCE_IDLE_MS) return

      const active = justReturned || lastInteraction > lastReportedInteraction
      if (active) lastReportedInteraction = lastInteraction
      try {
        await callAdmin('presencePing', { tabId, active })
      } catch {
        // Presence is optional: never interrupt check-in or staff tasks.
        if (active) lastReportedInteraction = 0
      }
    }

    const leave = () => {
      const body = JSON.stringify({ action: 'presenceLeave', tabId })
      // Beacon survives tab close and carries the existing same-origin httpOnly cookie.
      const beacon = navigator.sendBeacon?.(
        '/api/admin',
        new Blob([body], { type: 'application/json' }),
      )
      if (!beacon) void callAdmin('presenceLeave', { tabId }).catch(() => {})
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        leave()
      } else {
        recordActivity()
        void ping(true)
      }
    }

    document.addEventListener('pointerdown', recordActivity, { passive: true })
    document.addEventListener('keydown', recordActivity)
    document.addEventListener('touchstart', recordActivity, { passive: true })
    window.addEventListener('scroll', recordActivity, { passive: true, capture: true })
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', leave)
    void ping(true)
    const timer = window.setInterval(() => void ping(), PRESENCE_HEARTBEAT_MS)

    return () => {
      disposed = true
      window.clearInterval(timer)
      document.removeEventListener('pointerdown', recordActivity)
      document.removeEventListener('keydown', recordActivity)
      document.removeEventListener('touchstart', recordActivity)
      window.removeEventListener('scroll', recordActivity, true)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', leave)
      leave()
    }
  }, [])

  return null
}
