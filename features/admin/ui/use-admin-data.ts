import { useCallback, useEffect, useRef, useState } from 'react'

// `load` must be stable (useCallback). Responses that arrive after a newer
// request, or after unmount, are dropped so a slow answer never overwrites a fresh one.
export function useAdminData<T>(
  load: () => Promise<T>,
  initial: T,
  onError: (error: unknown) => void,
) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)

  const reload = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    try {
      const next = await load()
      if (id === requestId.current) setData(next)
    } catch (error) {
      if (id === requestId.current) onError(error)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [load, onError])

  useEffect(() => {
    void reload()
    return () => {
      requestId.current++
    }
  }, [reload])

  return { data, setData, loading, reload }
}
