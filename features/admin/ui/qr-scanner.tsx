'use client'

import { CircleAlert } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

const REPEAT_WINDOW_MS = 5000

// Shared by check-in and the dynamics stands. html5-qrcode is loaded on mount so it
// never reaches public pages, and the camera is released whenever the view unmounts.
export function QrScanner({ onScan }: { onScan: (text: string) => void }) {
  const elementId = `qr-scanner-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const onScanRef = useRef(onScan)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    onScanRef.current = onScan
  })

  useEffect(() => {
    let cancelled = false
    let stop: (() => Promise<void>) | null = null
    const last = { text: '', at: 0 }

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
            qrbox: (width, height) => {
              const size = Math.floor(Math.min(width, height) * 0.7)
              return { width: size, height: size }
            },
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
        // Stopping must wait for start, or a fast unmount leaves the camera on.
        stop = () =>
          started
            .then(() => scanner.stop())
            .then(() => scanner.clear())
            .catch(() => {})
        return started
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      void stop?.()
    }
  }, [elementId])

  return (
    <div className="overflow-hidden rounded-card border border-neo-border bg-neo-black">
      <div id={elementId} className={failed ? 'hidden' : 'aspect-[4/3] w-full'} />
      {failed ? (
        <p
          role="alert"
          className="m-0 flex items-start gap-2 bg-neo-danger-bg px-4 py-3 text-sm text-neo-danger"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          Permite el acceso a la cámara o escribe el código.
        </p>
      ) : null}
    </div>
  )
}
