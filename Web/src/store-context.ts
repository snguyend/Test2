import { createContext, useContext } from 'react'
import type {
  Goal,
  HabitGoal,
  Homework,
  BlogPost,
  AboutContent,
  JournalEntry,
  GrowthSnapshot,
  SchoolYearOverride,
  Encouragement,
  Reward,
  ScoreEntry,
  Student,
} from './types'

export type SyncState = 'local' | 'synced' | 'syncing' | 'error'

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
  encouragements: Encouragement[]
  homework: Homework[]
  blogPosts: BlogPost[]
  aboutContent: AboutContent
  /** True when reads/writes are backed by Supabase (signed in), false for localStorage. */
  remote: boolean
  /** Cloud sync status for the header indicator. */
  syncState: SyncState
  /** Re-fetch all data from the backend (no-op in local mode). */
  reload: () => void
  addStudent: (student: Omit<Student, 'id' | 'parentId'>) => void
  deleteStudent: (id: string) => void
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
  addEncouragement: (entry: Omit<Encouragement, 'id'>) => void
  deleteEncouragement: (id: string) => void
  addHomework: (hw: Omit<Homework, 'id'>) => void
  toggleHomework: (id: string) => void
  updateHomework: (id: string, patch: Partial<Omit<Homework, 'id' | 'studentId'>>) => void
  deleteHomework: (id: string) => void
  addBlogPost: (post: Omit<BlogPost, 'id'>) => void
  updateBlogPost: (id: string, patch: Partial<Omit<BlogPost, 'id'>>) => void
  deleteBlogPost: (id: string) => void
  /** Upload a blog banner photo; returns a URL (cloud) or the data URL (local). */
  uploadBlogPhoto: (dataUrl: string) => Promise<string>
  updateAboutContent: (content: AboutContent) => void
  /** Upload a hero photo; returns a URL (cloud) or the data URL (local). */
  uploadAboutPhoto: (dataUrl: string) => Promise<string>
  setStudentPhoto: (studentId: string, dataUrl: string) => void
  updateStudentGrade: (studentId: string, grade: string) => void
}

export const AppContext = createContext<AppState | undefined>(undefined)
export function useAppData() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppData must be used within AppProvider')
  return ctx
}
