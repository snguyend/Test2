import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Goal, Reward, ScoreEntry } from './types'
import { initialGoals, initialRewards, initialScores, students } from './data/mockData'

const PHOTO_KEY = 'eg-student-photos'

function loadPhotos(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PHOTO_KEY) ?? '{}')
  } catch {
    return {}
  }
}

interface AppState {
  students: typeof students
  scores: ScoreEntry[]
  goals: Goal[]
  rewards: Reward[]
  photos: Record<string, string>
  addScore: (score: Omit<ScoreEntry, 'id'>) => void
  toggleGoal: (goalId: string) => void
  setStudentPhoto: (studentId: string, dataUrl: string) => void
}

const AppContext = createContext<AppState | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [scores, setScores] = useState<ScoreEntry[]>(initialScores)
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [rewards, setRewards] = useState<Reward[]>(initialRewards)
  const [photos, setPhotos] = useState<Record<string, string>>(loadPhotos)

  const value = useMemo<AppState>(
    () => ({
      students,
      scores,
      goals,
      rewards,
      photos,
      addScore: (score) =>
        setScores((prev) => [
          ...prev,
          { ...score, id: `sc${Date.now()}` },
        ]),
      toggleGoal: (goalId) =>
        setGoals((prev) => {
          const goal = prev.find((g) => g.id === goalId)
          if (goal) {
            const nowDone = !goal.done
            setRewards((rs) =>
              rs.map((r) => (r.id === goal.rewardId ? { ...r, claimed: nowDone } : r)),
            )
          }
          return prev.map((g) => (g.id === goalId ? { ...g, done: !g.done } : g))
        }),
      setStudentPhoto: (studentId, dataUrl) =>
        setPhotos((prev) => {
          const next = { ...prev, [studentId]: dataUrl }
          try {
            localStorage.setItem(PHOTO_KEY, JSON.stringify(next))
          } catch {
            // ignore storage errors (e.g. quota exceeded)
          }
          return next
        }),
    }),
    [scores, goals, rewards, photos],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppData must be used within AppProvider')
  return ctx
}
