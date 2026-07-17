/**
 * Firebase (Firestore) data layer — mirrors `utils/supabaseStore.ts` so the store
 * can swap backends. See Firebase_Architecture.md.
 *
 * Layout: FLAT top-level collections (not nested subcollections) so document ids
 * are global — this makes update/delete-by-id match the Supabase signatures. Every
 * child-scoped doc carries `familyId` (and `childId`) for simple `where` queries
 * and Security Rules.
 *
 * Collections: families, familyMembers, users, children, rewards, scores,
 * academicGoals, habits, habitCheckins, weeklySnapshots, achievements,
 * parentNotes, encouragements, dailyCheckins.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { firebaseDb } from '../lib/firebase'
import type {
  Encouragement,
  Goal,
  GrowthSnapshot,
  HabitGoal,
  JournalEntry,
  Reward,
  ScoreEntry,
  Student,
} from '../types'
import { isoDay, isoWeek } from './growth'
import { STORAGE_KEYS, loadState } from './storage'

const db = () => firebaseDb()

/* ------------------------------------------------------------------ */
/* Active family (set at bootstrap so writes know where to go)         */
/* ------------------------------------------------------------------ */

let activeFamilyId: string | null = null

/** Set by bootstrap; child-scoped writes are placed under this family. */
export function setActiveFamily(id: string | null): void {
  activeFamilyId = id
}

function fam(): string {
  if (!activeFamilyId) throw new Error('[firebase] no active family — call setActiveFamily first')
  return activeFamilyId
}

/* ------------------------------------------------------------------ */
/* Doc -> domain mappers                                               */
/* ------------------------------------------------------------------ */

export function toStudent(id: string, d: DocumentData): Student {
  return {
    id,
    name: d.name,
    grade: d.grade ?? '',
    avatar: d.avatar ?? '👤',
    color: d.color ?? '#2563eb',
    parentId: d.familyId,
    birthYear: d.birthYear ?? undefined,
  }
}

export function toScore(id: string, d: DocumentData): ScoreEntry {
  return {
    id,
    studentId: d.childId,
    subject: d.subject,
    score: d.score,
    maxScore: d.maxScore ?? 10,
    date: d.date,
    semester: d.semester ?? 'first',
    grade: d.gradeLevel ?? undefined,
    term: d.term ?? undefined,
    notes: d.notes ?? undefined,
  }
}

export function toGoal(id: string, d: DocumentData): Goal {
  return {
    id,
    studentId: d.childId,
    title: d.title ?? '',
    rewardId: d.rewardId ?? '',
    done: !!d.done,
    subject: d.subject ?? undefined,
    targetScore: d.targetScore ?? undefined,
    points: d.points ?? 0,
  }
}

export function toReward(id: string, d: DocumentData): Reward {
  return {
    id,
    name: d.name,
    icon: d.icon ?? '🎁',
    claimed: !!d.claimed,
    cost: d.cost ?? 0,
    category: d.category ?? undefined,
  }
}

export function toHabitGoal(id: string, d: DocumentData): HabitGoal {
  return {
    id,
    studentId: d.childId,
    activity: d.name,
    icon: d.icon ?? '⭐',
    unit: d.unit ?? 'sessions',
    weeklyTarget: d.targetWeeklyValue ?? 0,
    weeklyProgress: d.weeklyProgress ?? 0,
  }
}

export function toGrowthSnapshot(d: DocumentData): GrowthSnapshot {
  return { studentId: d.childId, date: d.weekStart, score: d.growthScore ?? 0 }
}

export function toJournalEntry(id: string, d: DocumentData): JournalEntry {
  return {
    id,
    studentId: d.childId,
    date: d.date,
    wentWell: d.wentWell ?? [],
    toImprove: d.toImprove ?? [],
    nextGoals: d.nextGoals ?? [],
    parentReflection: d.reflection ?? '',
  }
}

export function toEncouragement(id: string, d: DocumentData): Encouragement {
  return { id, studentId: d.childId, from: d.author, message: d.message, date: d.date }
}

/* ------------------------------------------------------------------ */
/* Week helpers                                                        */
/* ------------------------------------------------------------------ */

function currentMonday(): string {
  const d = new Date()
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return isoDay(d)
}

/* ------------------------------------------------------------------ */
/* Aggregate load                                                      */
/* ------------------------------------------------------------------ */

export interface FamilyState {
  students: Student[]
  scores: ScoreEntry[]
  goals: Goal[]
  rewards: Reward[]
  habitGoals: HabitGoal[]
  journal: JournalEntry[]
  checkIns: string[]
  growthHistory: GrowthSnapshot[]
  encouragements: Encouragement[]
}

async function byFamily(name: string, familyId: string) {
  const snap = await getDocs(query(collection(db(), name), where('familyId', '==', familyId)))
  return snap.docs
}

/** Load every slice the store needs for a family. */
export async function fetchFamilyState(familyId: string): Promise<FamilyState> {
  const [children, scores, goals, rewards, habits, notes, snaps, encs, checkins] =
    await Promise.all([
      byFamily('children', familyId),
      byFamily('scores', familyId),
      byFamily('academicGoals', familyId),
      byFamily('rewards', familyId),
      byFamily('habits', familyId),
      byFamily('parentNotes', familyId),
      byFamily('weeklySnapshots', familyId),
      byFamily('encouragements', familyId),
      byFamily('dailyCheckins', familyId),
    ])

  return {
    students: children.map((d) => toStudent(d.id, d.data())),
    scores: scores.map((d) => toScore(d.id, d.data())),
    goals: goals.map((d) => toGoal(d.id, d.data())),
    rewards: rewards.map((d) => toReward(d.id, d.data())),
    habitGoals: habits.map((d) => toHabitGoal(d.id, d.data())),
    journal: notes.map((d) => toJournalEntry(d.id, d.data())),
    checkIns: [...new Set(checkins.map((d) => d.data().date as string))].sort(),
    growthHistory: snaps
      .map((d) => toGrowthSnapshot(d.data()))
      .sort((a, b) => a.date.localeCompare(b.date)),
    encouragements: encs.map((d) => toEncouragement(d.id, d.data())),
  }
}

/* ------------------------------------------------------------------ */
/* Children                                                            */
/* ------------------------------------------------------------------ */

export async function addChild(
  familyId: string,
  child: Omit<Student, 'id' | 'parentId'>,
): Promise<Student> {
  const ref = await addDoc(collection(db(), 'children'), {
    familyId,
    name: child.name,
    grade: child.grade ?? null,
    avatar: child.avatar ?? null,
    color: child.color ?? null,
    birthYear: child.birthYear ?? null,
    createdAt: serverTimestamp(),
  })
  const snap = await getDoc(ref)
  return toStudent(ref.id, snap.data() ?? {})
}

export async function updateChildGrade(id: string, grade: string): Promise<void> {
  await updateDoc(doc(db(), 'children', id), { grade })
}

export async function setChildAvatar(id: string, avatar: string): Promise<void> {
  await updateDoc(doc(db(), 'children', id), { avatar })
}

export async function deleteChild(id: string): Promise<void> {
  // Flat layout has no cascade — remove the child's related docs too.
  const collections = [
    'scores',
    'academicGoals',
    'habits',
    'weeklySnapshots',
    'achievements',
    'parentNotes',
    'encouragements',
    'dailyCheckins',
  ]
  const batch = writeBatch(db())
  for (const name of collections) {
    const snap = await getDocs(query(collection(db(), name), where('childId', '==', id)))
    snap.docs.forEach((d) => batch.delete(d.ref))
  }
  batch.delete(doc(db(), 'children', id))
  await batch.commit()
}

/* ------------------------------------------------------------------ */
/* Scores                                                              */
/* ------------------------------------------------------------------ */

export async function addScore(entry: Omit<ScoreEntry, 'id'>): Promise<ScoreEntry> {
  const ref = await addDoc(collection(db(), 'scores'), {
    familyId: fam(),
    childId: entry.studentId,
    subject: entry.subject,
    score: entry.score,
    maxScore: entry.maxScore ?? 10,
    date: entry.date,
    semester: entry.semester,
    gradeLevel: entry.grade ?? null,
    term: entry.term ?? null,
    notes: entry.notes ?? null,
    createdAt: serverTimestamp(),
  })
  const snap = await getDoc(ref)
  return toScore(ref.id, snap.data() ?? {})
}

export async function updateScoreValue(id: string, score: number): Promise<void> {
  await updateDoc(doc(db(), 'scores', id), { score })
}

export async function deleteScore(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'scores', id))
}

export async function setSubjectAverage(
  studentId: string,
  subject: string,
  target: number,
): Promise<void> {
  const snap = await getDocs(
    query(
      collection(db(), 'scores'),
      where('childId', '==', studentId),
      where('subject', '==', subject),
    ),
  )
  if (snap.empty) return
  const rows = snap.docs.map((d) => ({ ref: d.ref, score: d.data().score as number }))
  const currentAvg = rows.reduce((sum, r) => sum + r.score, 0) / rows.length
  const delta = Math.round(target) - Math.round(currentAvg)
  if (delta === 0) return
  const batch = writeBatch(db())
  rows.forEach((r) =>
    batch.update(r.ref, { score: Math.max(0, Math.min(10, r.score + delta)) }),
  )
  await batch.commit()
}

/* ------------------------------------------------------------------ */
/* Academic goals                                                      */
/* ------------------------------------------------------------------ */

export async function addGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
  const ref = await addDoc(collection(db(), 'academicGoals'), {
    familyId: fam(),
    childId: goal.studentId,
    title: goal.title,
    subject: goal.subject ?? null,
    targetScore: goal.targetScore ?? null,
    rewardId: goal.rewardId || null,
    points: goal.points,
    done: goal.done,
    doneAt: goal.done ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
  })
  const snap = await getDoc(ref)
  return toGoal(ref.id, snap.data() ?? {})
}

export async function updateGoal(id: string, patch: Partial<Omit<Goal, 'id'>>): Promise<void> {
  const dbPatch: DocumentData = {}
  if (patch.title !== undefined) dbPatch.title = patch.title
  if (patch.subject !== undefined) dbPatch.subject = patch.subject ?? null
  if (patch.targetScore !== undefined) dbPatch.targetScore = patch.targetScore ?? null
  if (patch.rewardId !== undefined) dbPatch.rewardId = patch.rewardId || null
  if (patch.points !== undefined) dbPatch.points = patch.points
  if (patch.done !== undefined) {
    dbPatch.done = patch.done
    dbPatch.doneAt = patch.done ? serverTimestamp() : null
  }
  if (Object.keys(dbPatch).length === 0) return
  await updateDoc(doc(db(), 'academicGoals', id), dbPatch)
}

/** Toggle completion and mirror the state onto the linked reward. */
export async function toggleGoal(goalId: string): Promise<void> {
  const ref = doc(db(), 'academicGoals', goalId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  const nowDone = !data.done
  await updateDoc(ref, { done: nowDone, doneAt: nowDone ? serverTimestamp() : null })
  if (data.rewardId) {
    await updateDoc(doc(db(), 'rewards', data.rewardId as string), { claimed: nowDone })
  }
}

export async function deleteGoal(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'academicGoals', id))
}

/* ------------------------------------------------------------------ */
/* Rewards                                                             */
/* ------------------------------------------------------------------ */

export async function addReward(
  familyId: string,
  reward: Omit<Reward, 'id' | 'claimed'>,
): Promise<Reward> {
  const ref = await addDoc(collection(db(), 'rewards'), {
    familyId,
    name: reward.name,
    icon: reward.icon ?? null,
    cost: reward.cost,
    category: reward.category ?? null,
    claimed: false,
    createdAt: serverTimestamp(),
  })
  const snap = await getDoc(ref)
  return toReward(ref.id, snap.data() ?? {})
}

export async function setRewardClaimed(id: string, claimed: boolean): Promise<void> {
  await updateDoc(doc(db(), 'rewards', id), { claimed })
}

/* ------------------------------------------------------------------ */
/* Habits + check-ins                                                  */
/* ------------------------------------------------------------------ */

export async function addHabit(habit: Omit<HabitGoal, 'id'>): Promise<HabitGoal> {
  const ref = await addDoc(collection(db(), 'habits'), {
    familyId: fam(),
    childId: habit.studentId,
    name: habit.activity,
    icon: habit.icon ?? null,
    unit: habit.unit ?? null,
    targetWeeklyValue: habit.weeklyTarget,
    weeklyProgress: habit.weeklyProgress ?? 0,
    createdAt: serverTimestamp(),
  })
  if (habit.weeklyProgress && habit.weeklyProgress > 0) {
    await addDoc(collection(db(), 'habitCheckins'), {
      familyId: fam(),
      childId: habit.studentId,
      habitId: ref.id,
      value: habit.weeklyProgress,
      date: isoDay(new Date()),
      createdAt: serverTimestamp(),
    })
  }
  const snap = await getDoc(ref)
  return toHabitGoal(ref.id, snap.data() ?? {})
}

export async function updateHabit(
  id: string,
  patch: Partial<Pick<HabitGoal, 'activity' | 'icon' | 'unit' | 'weeklyTarget'>>,
): Promise<void> {
  const dbPatch: DocumentData = {}
  if (patch.activity !== undefined) dbPatch.name = patch.activity
  if (patch.icon !== undefined) dbPatch.icon = patch.icon
  if (patch.unit !== undefined) dbPatch.unit = patch.unit
  if (patch.weeklyTarget !== undefined) dbPatch.targetWeeklyValue = patch.weeklyTarget
  if (Object.keys(dbPatch).length === 0) return
  await updateDoc(doc(db(), 'habits', id), dbPatch)
}

export async function deleteHabit(id: string): Promise<void> {
  const snap = await getDocs(
    query(collection(db(), 'habitCheckins'), where('habitId', '==', id)),
  )
  const batch = writeBatch(db())
  snap.docs.forEach((d) => batch.delete(d.ref))
  batch.delete(doc(db(), 'habits', id))
  await batch.commit()
}

/** Log a check-in and bump the denormalised weekly counter on the habit. */
export async function addHabitCheckin(
  habitId: string,
  value: number,
  date: string = isoDay(new Date()),
): Promise<void> {
  const habitRef = doc(db(), 'habits', habitId)
  const habitSnap = await getDoc(habitRef)
  const childId = habitSnap.data()?.childId as string | undefined
  await addDoc(collection(db(), 'habitCheckins'), {
    familyId: fam(),
    childId: childId ?? null,
    habitId,
    value,
    date,
    createdAt: serverTimestamp(),
  })
  await updateDoc(habitRef, { weeklyProgress: increment(value) })
}

/** Replace this week's progress with a single aggregate value (UI bridge). */
export async function setHabitWeeklyProgress(habitId: string, value: number): Promise<void> {
  const monday = currentMonday()
  const snap = await getDocs(
    query(
      collection(db(), 'habitCheckins'),
      where('habitId', '==', habitId),
      where('date', '>=', monday),
    ),
  )
  const batch = writeBatch(db())
  snap.docs.forEach((d) => batch.delete(d.ref))
  batch.update(doc(db(), 'habits', habitId), { weeklyProgress: value })
  await batch.commit()
  if (value > 0) await addHabitCheckin(habitId, value)
}

/* ------------------------------------------------------------------ */
/* Journal (parentNotes)                                               */
/* ------------------------------------------------------------------ */

export async function addJournalEntry(entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
  const ref = await addDoc(collection(db(), 'parentNotes'), {
    familyId: fam(),
    childId: entry.studentId,
    date: entry.date,
    wentWell: entry.wentWell,
    toImprove: entry.toImprove,
    nextGoals: entry.nextGoals,
    reflection: entry.parentReflection,
    createdAt: serverTimestamp(),
  })
  const snap = await getDoc(ref)
  return toJournalEntry(ref.id, snap.data() ?? {})
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'parentNotes', id))
}

/* ------------------------------------------------------------------ */
/* Daily check-ins (streak)                                            */
/* ------------------------------------------------------------------ */

export async function recordDailyCheckin(
  childId: string,
  date: string = isoDay(new Date()),
): Promise<void> {
  await setDoc(doc(db(), 'dailyCheckins', `${childId}_${date}`), {
    familyId: fam(),
    childId,
    date,
    createdAt: serverTimestamp(),
  })
}

/* ------------------------------------------------------------------ */
/* Weekly growth snapshots                                             */
/* ------------------------------------------------------------------ */

export async function upsertGrowthSnapshot(
  childId: string,
  date: string,
  growthScore: number,
  academicScore: number | null = null,
  habitScore: number | null = null,
): Promise<void> {
  const d = new Date(date)
  const year = d.getFullYear()
  const week = isoWeek(d)
  await setDoc(
    doc(db(), 'weeklySnapshots', `${childId}_${year}W${week}`),
    {
      familyId: fam(),
      childId,
      year,
      weekNumber: week,
      weekStart: date,
      growthScore,
      academicScore,
      habitScore,
    },
    { merge: true },
  )
}

/* ------------------------------------------------------------------ */
/* Encouragements                                                      */
/* ------------------------------------------------------------------ */

export async function addEncouragement(
  entry: Omit<Encouragement, 'id'>,
): Promise<Encouragement> {
  const ref = await addDoc(collection(db(), 'encouragements'), {
    familyId: fam(),
    childId: entry.studentId,
    message: entry.message,
    author: entry.from,
    date: entry.date ?? isoDay(new Date()),
    createdAt: serverTimestamp(),
  })
  const snap = await getDoc(ref)
  return toEncouragement(ref.id, snap.data() ?? {})
}

export async function deleteEncouragement(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'encouragements', id))
}

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */

export async function grantAchievement(
  childId: string,
  badgeType: string,
  meta: Record<string, unknown> | null = null,
): Promise<void> {
  await setDoc(doc(db(), 'achievements', `${childId}_${badgeType}`), {
    familyId: fam(),
    childId,
    badgeType,
    meta,
    earnedAt: serverTimestamp(),
  })
}

/* ------------------------------------------------------------------ */
/* Auth bootstrap                                                      */
/* ------------------------------------------------------------------ */

export async function ensureUserProfile(user: {
  id: string
  email: string
  displayName?: string | null
}): Promise<void> {
  await setDoc(
    doc(db(), 'users', user.id),
    { email: user.email, displayName: user.displayName ?? null, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

/** Return the user's family id, creating a family + owner membership on first sign-in. */
export async function getOrCreateFamily(
  userId: string,
  familyName = 'My Family',
): Promise<string> {
  const existing = await getDocs(
    query(collection(db(), 'familyMembers'), where('userId', '==', userId), limit(1)),
  )
  if (!existing.empty) {
    const fid = existing.docs[0].data().familyId as string
    setActiveFamily(fid)
    return fid
  }

  const familyRef = await addDoc(collection(db(), 'families'), {
    name: familyName,
    ownerUserId: userId,
    createdAt: serverTimestamp(),
  })
  // Deterministic membership id (`${familyId}_${userId}`) so Security Rules can
  // check membership with exists() instead of a query.
  await setDoc(doc(db(), 'familyMembers', `${familyRef.id}_${userId}`), {
    familyId: familyRef.id,
    userId,
    role: 'owner',
    joinedAt: serverTimestamp(),
  })
  setActiveFamily(familyRef.id)
  return familyRef.id
}

/* ------------------------------------------------------------------ */
/* One-time migration: localStorage -> Firestore                       */
/* ------------------------------------------------------------------ */

export interface MigrationSummary {
  students: number
  rewards: number
  scores: number
  goals: number
  habits: number
  journal: number
  growthSnapshots: number
  encouragements: number
  dailyCheckins: number
}

export async function migrateLocalStorageToFirebase(
  familyId: string,
): Promise<MigrationSummary> {
  setActiveFamily(familyId)
  const students = loadState<Student[]>(STORAGE_KEYS.students, [])
  const scores = loadState<ScoreEntry[]>(STORAGE_KEYS.scores, [])
  const goals = loadState<Goal[]>(STORAGE_KEYS.goals, [])
  const rewards = loadState<Reward[]>(STORAGE_KEYS.rewards, [])
  const habitGoals = loadState<HabitGoal[]>(STORAGE_KEYS.habitGoals, [])
  const journal = loadState<JournalEntry[]>(STORAGE_KEYS.journal, [])
  const checkIns = loadState<string[]>(STORAGE_KEYS.checkIns, [])
  const growthHistory = loadState<GrowthSnapshot[]>(STORAGE_KEYS.growthHistory, [])
  const encouragements = loadState<Encouragement[]>(STORAGE_KEYS.encouragements, [])

  const studentIdMap = new Map<string, string>()
  for (const s of students) {
    const created = await addChild(familyId, {
      name: s.name,
      grade: s.grade,
      avatar: s.avatar,
      color: s.color,
      birthYear: s.birthYear,
    })
    studentIdMap.set(s.id, created.id)
  }

  const rewardIdMap = new Map<string, string>()
  for (const r of rewards) {
    const created = await addReward(familyId, {
      name: r.name,
      icon: r.icon,
      cost: r.cost,
      category: r.category,
    })
    rewardIdMap.set(r.id, created.id)
    if (r.claimed) await setRewardClaimed(created.id, true)
  }

  let scoreCount = 0
  for (const sc of scores) {
    const childId = studentIdMap.get(sc.studentId)
    if (!childId) continue
    const { id: _id, studentId: _s, ...rest } = sc
    await addScore({ ...rest, studentId: childId })
    scoreCount++
  }

  let goalCount = 0
  for (const g of goals) {
    const childId = studentIdMap.get(g.studentId)
    if (!childId) continue
    const { id: _id, studentId: _s, rewardId, ...rest } = g
    await addGoal({ ...rest, studentId: childId, rewardId: rewardIdMap.get(rewardId) ?? '' })
    goalCount++
  }

  let habitCount = 0
  for (const h of habitGoals) {
    const childId = studentIdMap.get(h.studentId)
    if (!childId) continue
    const { id: _id, studentId: _s, ...rest } = h
    await addHabit({ ...rest, studentId: childId })
    habitCount++
  }

  let journalCount = 0
  for (const j of journal) {
    const childId = studentIdMap.get(j.studentId)
    if (!childId) continue
    const { id: _id, studentId: _s, ...rest } = j
    await addJournalEntry({ ...rest, studentId: childId })
    journalCount++
  }

  let snapshotCount = 0
  for (const snap of growthHistory) {
    const childId = studentIdMap.get(snap.studentId)
    if (!childId) continue
    await upsertGrowthSnapshot(childId, snap.date, snap.score)
    snapshotCount++
  }

  let encouragementCount = 0
  for (const e of encouragements) {
    const childId = studentIdMap.get(e.studentId)
    if (!childId) continue
    const { id: _id, studentId: _s, ...rest } = e
    await addEncouragement({ ...rest, studentId: childId })
    encouragementCount++
  }

  let checkinCount = 0
  const firstChildId = studentIdMap.values().next().value
  if (firstChildId) {
    for (const date of checkIns) {
      await recordDailyCheckin(firstChildId, date)
      checkinCount++
    }
  }

  return {
    students: studentIdMap.size,
    rewards: rewardIdMap.size,
    scores: scoreCount,
    goals: goalCount,
    habits: habitCount,
    journal: journalCount,
    growthSnapshots: snapshotCount,
    encouragements: encouragementCount,
    dailyCheckins: checkinCount,
  }
}
