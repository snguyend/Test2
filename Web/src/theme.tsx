import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext, type ThemeMode, type ToneId } from './theme-context'

function readStored<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) || fallback
  } catch {
    return fallback
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => readStored('eg-theme-mode', 'light'))
  const [tone, setTone] = useState<ToneId>(() => readStored('eg-theme-tone', 'blue'))

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
    try {
      localStorage.setItem('eg-theme-mode', mode)
    } catch {
      // ignore storage errors
    }
  }, [mode])

  useEffect(() => {
    document.documentElement.setAttribute('data-tone', tone)
    try {
      localStorage.setItem('eg-theme-tone', tone)
    } catch {
      // ignore storage errors
    }
  }, [tone])

  return (
    <ThemeContext.Provider value={{ mode, tone, setMode, setTone }}>
      {children}
    </ThemeContext.Provider>
  )
}
