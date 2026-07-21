import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
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
import {
  initialGoals,
  initialHabitGoals,
  initialHomework,
  initialBlogPosts,
  defaultAboutContent,
  initialJournal,
  initialGrowthHistory,
  initialEncouragements,
  initialRewards,
  initialScores,
  students as seedStudents,
} from './data/mockData'
import { STORAGE_KEYS, loadState, saveState } from './utils/storage'
import { MAX_SCORE } from './utils/scores'
import { AppContext, type AppState, type SyncState } from './store-context'
import { isSupabaseConfigured, PUBLIC_FAMILY_ID } from './lib/supabase'
import { useAuth } from './auth-context'
import * as SB from './utils/supabaseStore'

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
  const [encouragements, setEncouragements] = useState<Encouragement[]>(() =>
    loadState(STORAGE_KEYS.encouragements, initialEncouragements),
  )
  const [homework, setHomework] = useState<Homework[]>(() =>
    loadState(STORAGE_KEYS.homework, initialHomework),
  )
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() =>
    loadState(STORAGE_KEYS.blogPosts, initialBlogPosts),
  )
  const [aboutContent, setAboutContent] = useState<AboutContent>(() =>
    loadState(STORAGE_KEYS.aboutContent, defaultAboutContent),
  )

  // Remote mode is on when Supabase is configured AND a family is resolved.
  // For no-login public sharing, fall back to the shared PUBLIC_FAMILY_ID so
  // everyone who opens the URL reads/writes the same cloud family.
  const { familyId: authFamilyId } = useAuth()
  const familyId = authFamilyId ?? PUBLIC_FAMILY_ID ?? null
  const remoteMode = isSupabaseConfigured && !!familyId

  // Cloud sync status (drives the header indicator).
  const [pending, setPending] = useState(0)
  const [syncError, setSyncError] = useState(false)
  const syncState: SyncState = !remoteMode
    ? 'local'
    : pending > 0
      ? 'syncing'
      : syncError
        ? 'error'
        : 'synced'

  // Pull the whole family state from Supabase into local React state.
  const reload = useCallback(() => {
    if (!isSupabaseConfigured || !familyId) return
    setPending((n) => n + 1)
    SB.fetchFamilyState(familyId)
      .then((s) => {
        setStudents(s.students)
        setScores(s.scores)
        setGoals(s.goals)
        setRewards(s.rewards)
        setHabitGoals(s.habitGoals)
        setJournal(s.journal)
        setCheckIns(s.checkIns)
        setGrowthHistory(s.growthHistory)
        setEncouragements(s.encouragements)
        setHomework(s.homework)
        setBlogPosts(s.blogPosts)
        setAboutContent(s.aboutContent)
        setPhotos(s.photos)
        setSyncError(false)
      })
      .catch((err) => {
        console.error('[store] reload failed', err)
        setSyncError(true)
      })
      .finally(() => setPending((n) => Math.max(0, n - 1)))
  }, [familyId])

  // Load remote data whenever a family becomes available. reload() synchronizes
  // from Supabase (an external system), which is a valid effect use here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => reload(), [reload])

  // Fire a remote write, then refetch to reconcile server-generated ids.
  const sync = useCallback(
    (op: Promise<unknown>) => {
      setPending((n) => n + 1)
      op.then(() => {
        setSyncError(false)
        reload()
      })
        .catch((err) => {
          console.error('[store] write failed', err)
          setSyncError(true)
        })
        .finally(() => setPending((n) => Math.max(0, n - 1)))
    },
    [reload],
  )

  // Persist each slice to localStorage — only in local (non-remote) mode.
  useEffect(() => {
    if (!remoteMode) saveState(STORAGE_KEYS.students, students)
  }, [students, remoteMode])
  useEffect(() => {
    if (!remoteMode) saveState(STORAGE_KEYS.scores, scores)
  }, [scores, remoteMode])
  useEffect(() => {
    if (!remoteMode) saveState(STORAGE_KEYS.goals, goals)
  }, [goals, remoteMode])
  useEffect(() => {
    if (!remoteMode) saveState(STORAGE_KEYS.rewards, rewards)
  }, [rewards, remoteMode])
  useEffect(() => {
    if (!remoteMode) saveState(STORAGE_KEYS.habitGoals, habitGoals)
  }, [habitGoals, remoteMode])
  useEffect(() => {
    if (!remoteMode) saveState(STORAGE_KEYS.journal, journal)
  }, [journal, remoteMode])
  useEffect(() => {
    if (!remoteMode) saveState(STORAGE_KEYS.checkIns, checkIns)
  }, [checkIns, remoteMode])
  useEffect(() => {
    if (!remoteMode) saveState(STORAGE_KEYS.growthHistory, growthHistory)
  }, [growthHistory, remoteMode])
  useEffect(() => {
    if (!remoteMode) saveState(STORAGE_KEYS.encouragements, encouragements)
  }, [encouragements, remoteMode])
  useEffect(() => {
    if (!remoteMode) saveState(STORAGE_KEYS.homework, homework)
  }, [homework, remoteMode])
  useEffect(() => {
    if (!remoteMode) saveState(STORAGE_KEYS.blogPosts, blogPosts)
  }, [blogPosts, remoteMode])
  useEffect(() => {
    if (!remoteMode) saveState(STORAGE_KEYS.aboutContent, aboutContent)
  }, [aboutContent, remoteMode])
  // Photos and school-year overrides are always local (no remote table yet).
  useEffect(() => saveState(STORAGE_KEYS.photos, photos), [photos])
  useEffect(() => saveState(STORAGE_KEYS.schoolYears, schoolYearOverrides), [schoolYearOverrides])

  // One-time refresh of the seed children's colours (only if still the old
  // defaults — never clobbers a colour the family picked themselves).
  useEffect(() => {
    if (loadState<boolean>('eg-colorfix-v1', false)) return
    // One-time seed-data migration; safe to set state once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === 's1' && s.color === '#2563eb') return { ...s, color: '#0891b2' }
        if (s.id === 's2' && s.color === '#db2777') return { ...s, color: '#e11d48' }
        return s
      }),
    )
    saveState('eg-colorfix-v1', true)
    // run once on mount
  }, [])

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
      encouragements,
      homework,
      blogPosts,
      aboutContent,
      remote: remoteMode,
      syncState,
      reload,
      addStudent: (student) => {
        const parentId = students[0]?.parentId ?? 'p1'
        setStudents((prev) => [
          ...prev,
          { ...student, id: `s${Date.now()}`, parentId },
        ])
        if (remoteMode && familyId) sync(SB.addChild(familyId, student))
      },
      deleteStudent: (id) => {
        setStudents((prev) => prev.filter((s) => s.id !== id))
        // Local mode: clean up the child's related records to avoid orphans.
        // Remote mode: the DB cascades on delete, then reload() resyncs.
        setScores((prev) => prev.filter((s) => s.studentId !== id))
        setGoals((prev) => prev.filter((g) => g.studentId !== id))
        setHabitGoals((prev) => prev.filter((h) => h.studentId !== id))
        setJournal((prev) => prev.filter((j) => j.studentId !== id))
        setGrowthHistory((prev) => prev.filter((g) => g.studentId !== id))
        setEncouragements((prev) => prev.filter((e) => e.studentId !== id))
        setHomework((prev) => prev.filter((h) => h.studentId !== id))
        if (remoteMode) sync(SB.deleteChild(id))
      },
      addScore: (score) => {
        setScores((prev) => [...prev, { ...score, id: `sc${Date.now()}` }])
        if (remoteMode) sync(SB.addScore(score))
      },
      updateScore: (id, score) => {
        const clamped = Math.max(0, Math.min(MAX_SCORE, Math.round(score)))
        setScores((prev) => prev.map((s) => (s.id === id ? { ...s, score: clamped } : s)))
        if (remoteMode) sync(SB.updateScoreValue(id, clamped))
      },
      deleteScore: (id) => {
        setScores((prev) => prev.filter((s) => s.id !== id))
        if (remoteMode) sync(SB.deleteScore(id))
      },
      setSubjectAverage: (studentId, subject, target) => {
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
        })
        if (remoteMode) sync(SB.setSubjectAverage(studentId, subject, target))
      },
      toggleGoal: (goalId) => {
        setGoals((prev) => {
          const goal = prev.find((g) => g.id === goalId)
          if (goal) {
            const nowDone = !goal.done
            setRewards((rs) =>
              rs.map((r) => (r.id === goal.rewardId ? { ...r, claimed: nowDone } : r)),
            )
          }
          return prev.map((g) => (g.id === goalId ? { ...g, done: !g.done } : g))
        })
        if (remoteMode) sync(SB.toggleGoal(goalId))
      },
      addGoal: (goal) => {
        setGoals((prev) => [...prev, { ...goal, id: `g${Date.now()}` }])
        if (remoteMode) sync(SB.addGoal(goal))
      },
      updateGoal: (id, patch) => {
        setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)))
        if (remoteMode) sync(SB.updateGoal(id, patch))
      },
      deleteGoal: (id) => {
        setGoals((prev) => prev.filter((g) => g.id !== id))
        if (remoteMode) sync(SB.deleteGoal(id))
      },
      addHabitGoal: (habit) => {
        setHabitGoals((prev) => [...prev, { ...habit, id: `h${Date.now()}` }])
        if (remoteMode) sync(SB.addHabit(habit))
      },
      updateHabitGoal: (id, patch) => {
        setHabitGoals((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)))
        if (remoteMode) {
          const meta: Partial<Pick<HabitGoal, 'activity' | 'icon' | 'unit' | 'weeklyTarget'>> = {}
          if (patch.activity !== undefined) meta.activity = patch.activity
          if (patch.icon !== undefined) meta.icon = patch.icon
          if (patch.unit !== undefined) meta.unit = patch.unit
          if (patch.weeklyTarget !== undefined) meta.weeklyTarget = patch.weeklyTarget
          if (Object.keys(meta).length > 0) sync(SB.updateHabit(id, meta))
          if (patch.weeklyProgress !== undefined)
            sync(SB.setHabitWeeklyProgress(id, patch.weeklyProgress))
        }
      },
      deleteHabitGoal: (id) => {
        setHabitGoals((prev) => prev.filter((h) => h.id !== id))
        if (remoteMode) sync(SB.deleteHabit(id))
      },
      addJournalEntry: (entry) => {
        setJournal((prev) => [{ ...entry, id: `j${Date.now()}` }, ...prev])
        if (remoteMode) sync(SB.addJournalEntry(entry))
      },
      deleteJournalEntry: (id) => {
        setJournal((prev) => prev.filter((e) => e.id !== id))
        if (remoteMode) sync(SB.deleteJournalEntry(id))
      },
      recordCheckIn: () => {
        const today = new Date()
        const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 10)
        setCheckIns((prev) => (prev.includes(iso) ? prev : [...prev, iso]))
        const firstStudentId = students[0]?.id
        if (remoteMode && firstStudentId) sync(SB.recordDailyCheckin(firstStudentId, iso))
      },
      snapshotGrowth: (studentId, date, score) => {
        setGrowthHistory((prev) => {
          const others = prev.filter((g) => !(g.studentId === studentId && g.date === date))
          return [...others, { studentId, date, score }]
        })
        if (remoteMode) sync(SB.upsertGrowthSnapshot(studentId, date, score))
      },
      setSchoolYear: (studentId, grade, start, end) =>
        setSchoolYearOverrides((prev) => ({ ...prev, [`${studentId}:${grade}`]: { start, end } })),
      resetSchoolYear: (studentId, grade) =>
        setSchoolYearOverrides((prev) => {
          const next = { ...prev }
          delete next[`${studentId}:${grade}`]
          return next
        }),
      addEncouragement: (entry) => {
        setEncouragements((prev) => [{ ...entry, id: `e${Date.now()}` }, ...prev])
        if (remoteMode) sync(SB.addEncouragement(entry))
      },
      deleteEncouragement: (id) => {
        setEncouragements((prev) => prev.filter((e) => e.id !== id))
        if (remoteMode) sync(SB.deleteEncouragement(id))
      },
      addHomework: (hw) => {
        setHomework((prev) => [...prev, { ...hw, id: `hw${Date.now()}` }])
        if (remoteMode) sync(SB.addHomework(hw))
      },
      toggleHomework: (id) => {
        setHomework((prev) => prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h)))
        if (remoteMode) sync(SB.toggleHomework(id))
      },
      updateHomework: (id, patch) => {
        setHomework((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)))
        if (remoteMode) sync(SB.updateHomework(id, patch))
      },
      deleteHomework: (id) => {
        setHomework((prev) => prev.filter((h) => h.id !== id))
        if (remoteMode) sync(SB.deleteHomework(id))
      },
      addBlogPost: (post) => {
        setBlogPosts((prev) => [{ ...post, id: `b${Date.now()}` }, ...prev])
        if (remoteMode && familyId) sync(SB.addBlogPost(familyId, post))
      },
      updateBlogPost: (id, patch) => {
        setBlogPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
        if (remoteMode) sync(SB.updateBlogPost(id, patch))
      },
      deleteBlogPost: (id) => {
        setBlogPosts((prev) => prev.filter((p) => p.id !== id))
        if (remoteMode) sync(SB.deleteBlogPost(id))
      },
      uploadBlogPhoto: async (dataUrl) => {
        if (remoteMode && familyId) return SB.uploadBlogPhoto(familyId, dataUrl)
        return dataUrl
      },
      updateAboutContent: (content) => {
        setAboutContent(content)
        if (remoteMode && familyId) sync(SB.upsertAboutContent(familyId, content))
      },
      uploadAboutPhoto: async (dataUrl) => {
        if (remoteMode && familyId) return SB.uploadAboutPhoto(familyId, dataUrl)
        return dataUrl
      },
      setStudentPhoto: (studentId, dataUrl) => {
        setPhotos((prev) => ({ ...prev, [studentId]: dataUrl }))
        if (remoteMode && familyId) sync(SB.uploadChildPhoto(familyId, studentId, dataUrl))
      },
      updateStudentGrade: (studentId, grade) => {
        setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, grade } : s)))
        if (remoteMode) sync(SB.updateChildGrade(studentId, grade))
      },
    }),
    [
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
      encouragements,
      homework,
      blogPosts,
      aboutContent,
      remoteMode,
      syncState,
      familyId,
      sync,
      reload,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
