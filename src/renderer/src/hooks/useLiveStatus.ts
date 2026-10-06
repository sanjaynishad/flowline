import { useEffect, useState } from 'react'
import type { LiveStatus } from '@shared/types'

const EMPTY: LiveStatus = {
  tracking: false,
  isAfk: false,
  current: null,
  activeSessionSec: 0,
  browserConnected: false
}

export function useLiveStatus(): LiveStatus {
  const [status, setStatus] = useState<LiveStatus>(EMPTY)

  useEffect(() => {
    let mounted = true
    window.api.getStatus().then((s) => {
      if (mounted) {
        setStatus(s)
      }
    })

    const off = window.api.onStatusUpdate((s) => setStatus(s))
    return () => {
      mounted = false
      off()
    }
  }, [])

  return status
}
