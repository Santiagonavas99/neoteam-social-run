import { RefreshCw } from 'lucide-react'

export function RefreshButton({
  loading,
  disabled,
  onClick,
}: {
  loading: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className="button button-secondary" onClick={onClick} disabled={disabled}>
      <RefreshCw
        aria-hidden
        className={`size-4 shrink-0 ${loading ? 'motion-safe:animate-spin' : ''}`}
      />
      <span className="sr-only md:not-sr-only">{loading ? 'Cargando…' : 'Actualizar'}</span>
    </button>
  )
}
