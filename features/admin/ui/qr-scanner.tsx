'use client'

import { useEffect, useId, useRef } from 'react'

// The camera reads the same QR several times a second; a deliberate second scan still gets through.
const REPEAT_WINDOW_MS = 1500

export type QrCameraState = 'starting' | 'ready' | 'failed'

// Shared by check-in and the dynamics stands. html5-qrcode is loaded on mount so it
// never reaches public pages, and the camera is released whenever the view unmounts.
export function QrScanner({
  onScan,
  onStateChange,
  retryToken = 0,
}: {
  onScan: (text: string) => void
  onStateChange: (state: QrCameraState) => void
  retryToken?: number
}) {
  const elementId = `qr-scanner-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const onScanRef = useRef(onScan)
  const onStateChangeRef = useRef(onStateChange)

  useEffect(() => {
    onScanRef.current = onScan
    onStateChangeRef.current = onStateChange
  })

  useEffect(() => {
    // Changing retryToken intentionally restarts the camera lifecycle.
    void retryToken
    let cancelled = false
    let stop: (() => Promise<void>) | null = null
    const last = { text: '', at: 0 }

    onStateChangeRef.current('starting')

    import('html5-qrcode')
      .then(({ Html5Qrcode, Html5QrcodeSupportedFormats }) => {
        if (cancelled) return
        const scanner = new Html5Qrcode(elementId, {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          useBarCodeDetectorIfSupported: true,
        })
        const started = scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
          },
          (text) => {
            const now = Date.now()
            if (text === last.text && now - last.at < REPEAT_WINDOW_MS) return
            last.text = text
            last.at = now
            onScanRef.current(text)
          },
          () => {},
        )
        stop = () =>
          started
            .then(() => scanner.stop())
            .then(() => scanner.clear())
            .catch(() => {})
        return started.then(() => {
          if (!cancelled) onStateChangeRef.current('ready')
        })
      })
      .catch(() => {
        if (!cancelled) onStateChangeRef.current('failed')
      })

    return () => {
      cancelled = true
      void stop?.()
    }
  }, [elementId, retryToken])

  return (
    <div
      id={elementId}
      className="absolute inset-0 h-full w-full [&_canvas]:h-full! [&_canvas]:w-full! [&_video]:h-full! [&_video]:w-full! [&_video]:object-cover"
    />
  )
}
