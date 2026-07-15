import { createContext, useContext } from 'react'
import type {
  Goal,
  HabitGoal,
  JournalEntry,
  GrowthSnapshot,
  SchoolYearOverride,
  Reward,
  ScoreEntry,
  Student,
} from './types'

export interface AppState {
  students: Student[]
  scores: ScoreEntry[]
  goals: Goal[]
  rewards: Reward[]
  photos: Record<string, string>
  habitGoals: HabitGoal[]
  journal: JournalEntry[]
  checkIns: string[]
  growthHistory: GrowthSnapshot[]
  schoolYearOverrides: Record<string, SchoolYearOverride>
  addScore: (score: Omit<ScoreEntry, 'id'>) => void
  updateScore: (id: string, score: number) => void
  deleteScore: (id: string) => void
  setSubjectAverage: (studentId: string, subject: string, target: number) => void
  toggleGoal: (goalId: string) => void
  addGoal: (goal: Omit<Goal, 'id'>) => void
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id'>>) => void
  deleteGoal: (id: string) => void
  addHabitGoal: (habit: Omit<HabitGoal, 'id'>) => void
  updateHabitGoal: (id: string, patch: Partial<Omit<HabitGoal, 'id'>>) => void
  deleteHabitGoal: (id: string) => void
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void
  deleteJournalEntry: (id: string) => void
  recordCheckIn: () => void
  snapshotGrowth: (studentId: string, date: string, score: number) => void
  setSchoolYear: (studentId: string, grade: number, start: string, end: string) => void
  resetSchoolYear: (studentId: string, grade: number) => void
  setStudentPhoto: (studentId: string, dataUrl: string) => void
  updateStudentGrade: (studentId: string, grade: string) => void
}

export const AppContext = createContext<AppState | undefined>(undefined)

export function useAppData() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppData must be used within AppProvider')
  return ctx
}
