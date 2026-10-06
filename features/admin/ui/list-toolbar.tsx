import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { RefreshButton } from './refresh-button'

export function ListToolbar({
  searchLabel,
  placeholder,
  query,
  onQuery,
  filters,
  loading,
  refreshDisabled,
  onRefresh,
  action,
}: {
  searchLabel: string
  placeholder: string
  query: string
  onQuery: (query: string) => void
  filters?: ReactNode
  loading: boolean
  refreshDisabled: boolean
  onRefresh: () => void
  action?: ReactNode
}) {
  // Phones: search and refresh share the first row; filters and the main action take full rows below.
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 md:mb-6 md:flex-nowrap md:gap-3">
      <label className="relative order-1 min-w-0 flex-1 md:max-w-90">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neo-text-secondary"
        />
        <span className="sr-only">{searchLabel}</span>
        <input
          type="search"
          className="pl-10!"
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
      </label>
      {filters && <div className="order-3 basis-full md:order-2 md:basis-auto">{filters}</div>}
      <div className="order-2 md:order-3 md:ml-auto">
        <RefreshButton loading={loading} disabled={refreshDisabled} onClick={onRefresh} />
      </div>
      {action && (
        <div className="order-4 basis-full md:basis-auto [&>*]:w-full md:[&>*]:w-auto">
          {action}
        </div>
      )}
    </div>
  )
}
