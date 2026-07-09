import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Goal, Reward, ScoreEntry, Student } from './types'
import { initialGoals, initialRewards, initialScores, students as seedStudents } from './data/mockData'
import { STORAGE_KEYS, loadState, saveState } from './utils/storage'
import { MAX_SCORE } from './utils/scores'
import { AppContext, type AppState } from './store-context'

export function AppProvider({ children }: { children: ReactNode }) {
  const [students] = useState<Student[]>(() =>
    loadState(STORAGE_KEYS.students, seedStudents),
  )
  const [scores, setScores] = useState<ScoreEntry[]>(() =>
    loadState(STORAGE_KEYS.scores, initialScores),
  )
  const [goals, setGoals] = useState<Goal[]>(() => loadState(STORAGE_KEYS.goals, initialGoals))
  const [rewards, setRewards] = useState<Reward[]>(() =>
    loadState(STORAGE_KEYS.rewards, initialRewards),
  )
  const [photos, setPhotos] = useState<Record<string, string>>(() =>
    loadState(STORAGE_KEYS.photos, {}),
  )

  // Persist each slice whenever it changes so data survives a reload.
  useEffect(() => saveState(STORAGE_KEYS.students, students), [students])
  useEffect(() => saveState(STORAGE_KEYS.scores, scores), [scores])
  useEffect(() => saveState(STORAGE_KEYS.goals, goals), [goals])
  useEffect(() => saveState(STORAGE_KEYS.rewards, rewards), [rewards])
  useEffect(() => saveState(STORAGE_KEYS.photos, photos), [photos])

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
      updateScore: (id, score) =>
        setScores((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, score: Math.max(0, Math.min(MAX_SCORE, Math.round(score))) } : s,
          ),
        ),
      deleteScore: (id) => setScores((prev) => prev.filter((s) => s.id !== id)),
      setSubjectAverage: (studentId, subject, target) =>
        setScores((prev) => {
          const subset = prev.filter((s) => s.studentId === studentId && s.subject === subject)
          if (subset.length === 0) return prev
          const currentAvg = subset.reduce((sum, s) => sum + s.score, 0) / subset.length
          const delta = Math.round(target) - Math.round(currentAvg)
          if (delta === 0) return prev
          return prev.map((s) =>
            s.studentId === studentId && s.subject === subject
              ? { ...s, score: Math.max(0, Math.min(MAX_SCORE, s.score + delta)) }
              : s,
          )
        }),
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
        setPhotos((prev) => ({ ...prev, [studentId]: dataUrl })),
    }),
    [students, scores, goals, rewards, photos],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
