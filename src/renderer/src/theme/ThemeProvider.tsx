import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { ThemeMode } from '@shared/types'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  setMode: () => {}
})

function resolve(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }

  return mode
}

function apply(mode: ThemeMode): void {
  const effective = resolve(mode)
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(effective)
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [mode, setModeState] = useState<ThemeMode>('dark')

  useEffect(() => {
    window.api.getSettings().then((s) => {
      setModeState(s.theme)
      apply(s.theme)
    })
  }, [])

  useEffect(() => {
    apply(mode)
    if (mode !== 'system') {
      return
    }

    const mql = window.matchMedia('(prefers-color-scheme: light)')
    const listener = (): void => apply('system')
    mql.addEventListener('change', listener)
    return () => mql.removeEventListener('change', listener)
  }, [mode])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    apply(next)
    window.api.setSettings({ theme: next })
  }, [])

  return <ThemeContext.Provider value={{ mode, setMode }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
