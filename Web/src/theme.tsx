import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'
export type ToneId = 'blue' | 'forest' | 'sea' | 'sunset' | 'grape'

export const TONES: { id: ToneId; name: string; swatch: string }[] = [
  { id: 'blue', name: 'Sea Blue', swatch: '#2563eb' },
  { id: 'forest', name: 'Forest Green', swatch: '#16a34a' },
  { id: 'sea', name: 'Ocean Teal', swatch: '#0891b2' },
  { id: 'sunset', name: 'Sunset', swatch: '#ea580c' },
  { id: 'grape', name: 'Grape', swatch: '#7c3aed' },
]

interface ThemeState {
  mode: ThemeMode
  tone: ToneId
  setMode: (mode: ThemeMode) => void
  setTone: (tone: ToneId) => void
}

const ThemeContext = createContext<ThemeState | undefined>(undefined)

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

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
