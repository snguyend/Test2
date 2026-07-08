import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Goal, Reward, ScoreEntry } from './types'
import { initialGoals, initialRewards, initialScores, students } from './data/mockData'

interface AppState {
  students: typeof students
  scores: ScoreEntry[]
  goals: Goal[]
  rewards: Reward[]
  addScore: (score: Omit<ScoreEntry, 'id'>) => void
  toggleGoal: (goalId: string) => void
}

const AppContext = createContext<AppState | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [scores, setScores] = useState<ScoreEntry[]>(initialScores)
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [rewards, setRewards] = useState<Reward[]>(initialRewards)

  const value = useMemo<AppState>(
    () => ({
      students,
      scores,
      goals,
      rewards,
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
    }),
    [scores, goals, rewards],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppData must be used within AppProvider')
  return ctx
}
