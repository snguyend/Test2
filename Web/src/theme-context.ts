import { createContext, useContext } from 'react'

export type ThemeMode = 'light' | 'dark'
export type ToneId = 'blue' | 'forest' | 'sea' | 'sunset' | 'grape' | 'orchid'

export const TONES: { id: ToneId; name: string; swatch: string }[] = [
  { id: 'blue', name: 'Sea Blue', swatch: '#2563eb' },
  { id: 'forest', name: 'Forest Green', swatch: '#16a34a' },
  { id: 'sea', name: 'Ocean Teal', swatch: '#0891b2' },
  { id: 'sunset', name: 'Sunset', swatch: '#ea580c' },
  { id: 'grape', name: 'Grape', swatch: '#7c3aed' },
  { id: 'orchid', name: 'Courses Orchid', swatch: '#a855f7' },
]

export interface ThemeState {
  mode: ThemeMode
  tone: ToneId
  setMode: (mode: ThemeMode) => void
  setTone: (tone: ToneId) => void
}

export const ThemeContext = createContext<ThemeState | undefined>(undefined)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
