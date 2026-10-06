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
  return (
    <div className="section-toolbar">
      <div className="list-filters">
        <label className="search-field relative">
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
        {filters}
      </div>
      <div className="toolbar-actions">
        <RefreshButton loading={loading} disabled={refreshDisabled} onClick={onRefresh} />
        {action}
      </div>
    </div>
  )
}
