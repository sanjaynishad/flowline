import { useEffect, useRef, useState } from 'react'
import type { DateRange, RangePreset } from '@shared/types'
import { rangeFromPreset } from '@shared/range'

export function useRangeQuery<T>(
  preset: RangePreset,
  fetcher: (range: DateRange) => Promise<T>,
  intervalMs = 5000
): { data: T | null; refresh: () => void } {
  const [data, setData] = useState<T | null>(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const [tick, setTick] = useState(0)
  const refresh = (): void => setTick((t) => t + 1)

  useEffect(() => {
    let mounted = true
    const range = rangeFromPreset(preset)

    const run = (): void => {
      fetcherRef.current(range).then((res) => {
        if (mounted) {
          setData(res)
        }
      })
    }

    run()
    const id = setInterval(run, intervalMs)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [preset, intervalMs, tick])

  return { data, refresh }
}
