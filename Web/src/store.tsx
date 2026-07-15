import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Goal, HabitGoal, JournalEntry, Reward, ScoreEntry, Student } from './types'
import {
  initialGoals,
  initialHabitGoals,
  initialJournal,
  initialGrowthHistory,
  initialRewards,
  initialScores,
  students as seedStudents,
} from './data/mockData'
import { STORAGE_KEYS, loadState, saveState } from './utils/storage'
import { MAX_SCORE } from './utils/scores'
import { AppContext, type AppState } from './store-context'

export function AppProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(() =>
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
  const [habitGoals, setHabitGoals] = useState<HabitGoal[]>(() =>
    loadState(STORAGE_KEYS.habitGoals, initialHabitGoals),
  )
  const [journal, setJournal] = useState<JournalEntry[]>(() =>
    loadState(STORAGE_KEYS.journal, initialJournal),
  )
  const [checkIns, setCheckIns] = useState<string[]>(() =>
    loadState(STORAGE_KEYS.checkIns, []),
  )
  const [growthHistory, setGrowthHistory] = useState<GrowthSnapshot[]>(() =>
    loadState(STORAGE_KEYS.growthHistory, initialGrowthHistory),
  )
  const [schoolYearOverrides, setSchoolYearOverrides] = useState<Record<string, SchoolYearOverride>>(
    () => loadState(STORAGE_KEYS.schoolYears, {}),
  )

  // Persist each slice whenever it changes so data survives a reload.
  useEffect(() => saveState(STORAGE_KEYS.students, students), [students])
  useEffect(() => saveState(STORAGE_KEYS.scores, scores), [scores])
  useEffect(() => saveState(STORAGE_KEYS.goals, goals), [goals])
  useEffect(() => saveState(STORAGE_KEYS.rewards, rewards), [rewards])
  useEffect(() => saveState(STORAGE_KEYS.photos, photos), [photos])
  useEffect(() => saveState(STORAGE_KEYS.habitGoals, habitGoals), [habitGoals])
  useEffect(() => saveState(STORAGE_KEYS.journal, journal), [journal])
  useEffect(() => saveState(STORAGE_KEYS.checkIns, checkIns), [checkIns])
  useEffect(() => saveState(STORAGE_KEYS.growthHistory, growthHistory), [growthHistory])
  useEffect(() => saveState(STORAGE_KEYS.schoolYears, schoolYearOverrides), [schoolYearOverrides])

  const value = useMemo<AppState>(
    () => ({
      students,
      scores,
      goals,
      rewards,
      photos,
      habitGoals,
      journal,
      checkIns,
      growthHistory,
      schoolYearOverrides,
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
      addGoal: (goal) =>
        setGoals((prev) => [...prev, { ...goal, id: `g${Date.now()}` }]),
      updateGoal: (id, patch) =>
        setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g))),
      deleteGoal: (id) => setGoals((prev) => prev.filter((g) => g.id !== id)),
      addHabitGoal: (habit) =>
        setHabitGoals((prev) => [...prev, { ...habit, id: `h${Date.now()}` }]),
      updateHabitGoal: (id, patch) =>
        setHabitGoals((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h))),
      deleteHabitGoal: (id) => setHabitGoals((prev) => prev.filter((h) => h.id !== id)),
      addJournalEntry: (entry) =>
        setJournal((prev) => [{ ...entry, id: `j${Date.now()}` }, ...prev]),
      deleteJournalEntry: (id) => setJournal((prev) => prev.filter((e) => e.id !== id)),
      recordCheckIn: () =>
        setCheckIns((prev) => {
          const today = new Date()
          const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 10)
          return prev.includes(iso) ? prev : [...prev, iso]
        }),
      snapshotGrowth: (studentId, date, score) =>
        setGrowthHistory((prev) => {
          const others = prev.filter((g) => !(g.studentId === studentId && g.date === date))
          return [...others, { studentId, date, score }]
        }),
      setSchoolYear: (studentId, grade, start, end) =>
        setSchoolYearOverrides((prev) => ({ ...prev, [`${studentId}:${grade}`]: { start, end } })),
      resetSchoolYear: (studentId, grade) =>
        setSchoolYearOverrides((prev) => {
          const next = { ...prev }
          delete next[`${studentId}:${grade}`]
          return next
        }),
      setStudentPhoto: (studentId, dataUrl) =>
        setPhotos((prev) => ({ ...prev, [studentId]: dataUrl })),
      updateStudentGrade: (studentId, grade) =>
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, grade } : s)),
        ),
    }),
    [students, scores, goals, rewards, photos, habitGoals, journal, checkIns, growthHistory, schoolYearOverrides],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
