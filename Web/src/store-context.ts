import { createContext, useContext } from 'react'
import type { Goal, Reward, ScoreEntry, Student } from './types'

export interface AppState {
  students: Student[]
  scores: ScoreEntry[]
  goals: Goal[]
  rewards: Reward[]
  photos: Record<string, string>
  addScore: (score: Omit<ScoreEntry, 'id'>) => void
  updateScore: (id: string, score: number) => void
  deleteScore: (id: string) => void
  setSubjectAverage: (studentId: string, subject: string, target: number) => void
  toggleGoal: (goalId: string) => void
  setStudentPhoto: (studentId: string, dataUrl: string) => void
}

export const AppContext = createContext<AppState | undefined>(undefined)

export function useAppData() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppData must be used within AppProvider')
  return ctx
}
