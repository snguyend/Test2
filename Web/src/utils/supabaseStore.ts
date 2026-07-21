/**
 * Supabase data layer — a drop-in replacement for `utils/storage.ts`.
 *
 * `utils/storage.ts` reads/writes whole slices to `localStorage` synchronously.
 * This module talks to the PostgreSQL backend defined in `Data_Model.md` and
 * exposes:
 *   - mappers between DB rows (snake_case) and app domain types (camelCase),
 *   - per-entity async CRUD functions that mirror the actions in `store-context.ts`,
 *   - `fetchFamilyState(familyId)` to load every slice the store needs in one call.
 *
 * The store (`store.tsx`) can adopt this incrementally: keep the localStorage
 * store as a fallback when `isSupabaseConfigured` is false, and switch to these
 * functions once a Supabase project is wired up.
 *
 * NOTE: `photos` and `schoolYearOverrides` stay in localStorage for now
 * (see Data_Model.md §9 for the planned `child_school_years` table + Storage bucket).
 */
import { supabase } from '../lib/supabase'
import type {
  AcademicGoalRow,
  BlogPostRow,
  ChildRow,
  DailyCheckinRow,
  EncouragementRow,
  HabitCheckinRow,
  HabitRow,
  HomeworkRow,
  JournalEntryRow,
  RewardRow,
  ScoreRow,
  UpdateOf,
  WeeklySnapshotRow,
} from '../lib/database.types'
import type {
  AboutContent,
  BlogPost,
  Encouragement,
  Goal,
  GrowthSnapshot,
  HabitGoal,
  Homework,
  JournalEntry,
  Reward,
  ScoreEntry,
  Student,
} from '../types'
import { isoDay, isoWeek } from './growth'
import { STORAGE_KEYS, loadState } from './storage'
import { defaultAboutContent, initialBlogPosts } from '../data/mockData'

/* ------------------------------------------------------------------ */
/* Error helper                                                        */
/* ------------------------------------------------------------------ */

/**
 * Throws on a Supabase error, otherwise returns the non-null data cast to `T`.
 *
 * The typed client's `*`-expansion inference is unreliable under this project's
 * TS config (it widens rows to `{}`), so we assert the known row types from
 * `database.types.ts` here — the standard "typed boundary" pattern for network I/O.
 * Pass the expected type explicitly, e.g. `unwrap<ChildRow[]>(await query)`.
 */
function unwrap<T = unknown>(result: {
  data: unknown
  error: { message: string } | null
}): T {
  if (result.error) throw new Error(`[supabase] ${result.error.message}`)
  if (result.data == null) throw new Error('[supabase] query returned no data')
  return result.data as T
}

/* ------------------------------------------------------------------ */
/* Row → domain mappers                                                */
/* ------------------------------------------------------------------ */

export function toStudent(row: ChildRow): Student {
  return {
    id: row.id,
    name: row.name,
    grade: row.grade ?? '',
    avatar: row.avatar ?? '👤',
    color: row.color ?? '#2563eb',
    parentId: row.family_id, // app groups students under a family
    birthYear: row.birth_year ?? undefined,
  }
}

export function toScore(row: ScoreRow): ScoreEntry {
  return {
    id: row.id,
    studentId: row.child_id,
    subject: row.subject,
    score: row.score,
    maxScore: row.max_score,
    date: row.score_date,
    semester: row.semester ?? 'first',
    grade: row.grade_level ?? undefined,
    term: row.term ?? undefined,
    notes: row.notes ?? undefined,
  }
}

export function toGoal(row: AcademicGoalRow): Goal {
  return {
    id: row.id,
    studentId: row.child_id,
    title: row.title ?? '',
    rewardId: row.reward_id ?? '',
    done: row.done,
    subject: row.subject ?? undefined,
    targetScore: row.target_score ?? undefined,
    points: row.points,
  }
}

export function toReward(row: RewardRow): Reward {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon ?? '🎁',
    claimed: row.claimed,
    cost: row.cost,
    category: row.category ?? undefined,
  }
}

/** Habits need this-week's check-in sum to reproduce the UI's `weeklyProgress`. */
export function toHabitGoal(row: HabitRow, weeklyProgress: number): HabitGoal {
  return {
    id: row.id,
    studentId: row.child_id,
    activity: row.name,
    icon: row.icon ?? '⭐',
    unit: row.unit ?? 'sessions',
    weeklyTarget: row.target_weekly_value,
    weeklyProgress,
  }
}

export function toGrowthSnapshot(row: WeeklySnapshotRow): GrowthSnapshot {
  return {
    studentId: row.child_id,
    date: row.week_start,
    score: row.growth_score ?? 0,
  }
}

export function toJournalEntry(row: JournalEntryRow): JournalEntry {
  return {
    id: row.id,
    studentId: row.child_id,
    date: row.entry_date,
    wentWell: row.went_well,
    toImprove: row.to_improve,
    nextGoals: row.next_goals,
    parentReflection: row.parent_reflection ?? '',
  }
}

export function toEncouragement(row: EncouragementRow): Encouragement {
  return {
    id: row.id,
    studentId: row.child_id,
    from: row.author,
    message: row.message,
    date: row.created_at.slice(0, 10),
  }
}

export function toHomework(row: HomeworkRow): Homework {
  return {
    id: row.id,
    studentId: row.child_id,
    title: row.title,
    subject: row.subject ?? undefined,
    description: row.description ?? undefined,
    dueDate: row.due_date ?? undefined,
    done: row.done,
  }
}

export function toBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt ?? '',
    date: row.date_label ?? '',
    readMins: row.read_mins,
    emoji: row.emoji ?? '📝',
    color: row.color ?? '#6366f1',
    tag: row.tag ?? '',
    imageUrl: row.image_url ?? undefined,
  }
}

/* ------------------------------------------------------------------ */
/* Week helpers                                                        */
/* ------------------------------------------------------------------ */

/** Local ISO date (YYYY-MM-DD) of the current week's Monday. */
function currentMonday(): string {
  const d = new Date()
  const dow = (d.getDay() + 6) % 7 // 0 = Monday
  d.setDate(d.getDate() - dow)
  return isoDay(d)
}

/** Sum of habit check-in values within the current week, keyed by habit id. */
function weeklyProgressByHabit(checkins: HabitCheckinRow[]): Map<string, number> {
  const monday = currentMonday()
  const map = new Map<string, number>()
  for (const c of checkins) {
    if (c.checkin_date < monday) continue
    map.set(c.habit_id, (map.get(c.habit_id) ?? 0) + c.value)
  }
  return map
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
  homework: Homework[]
  blogPosts: BlogPost[]
  aboutContent: AboutContent
  photos: Record<string, string>
}

const EMPTY_STATE: FamilyState = {
  students: [],
  scores: [],
  goals: [],
  rewards: [],
  habitGoals: [],
  journal: [],
  checkIns: [],
  growthHistory: [],
  encouragements: [],
  homework: [],
  blogPosts: [],
  aboutContent: defaultAboutContent,
  photos: {},
}

/** Load every slice the store needs for a family in a handful of parallel queries. */
export async function fetchFamilyState(familyId: string): Promise<FamilyState> {
  const children = unwrap<ChildRow[]>(
    await supabase.from('children').select().eq('family_id', familyId).order('created_at'),
  )
  if (children.length === 0) return { ...EMPTY_STATE }

  const childIds = children.map((c) => c.id)

  const [scores, goals, rewards, habits, journal, checkins, snapshots, encouragements] =
    await Promise.all([
      supabase.from('scores').select().in('child_id', childIds),
      supabase.from('academic_goals').select().in('child_id', childIds),
      supabase.from('rewards').select().eq('family_id', familyId),
      supabase.from('habits').select().in('child_id', childIds),
      supabase.from('journal_entries').select().in('child_id', childIds),
      supabase.from('daily_checkins').select().in('child_id', childIds),
      supabase.from('weekly_snapshots').select().in('child_id', childIds).order('week_start'),
      supabase.from('encouragements').select().in('child_id', childIds),
    ])

  const habitRows = unwrap<HabitRow[]>(habits)
  const habitIds = habitRows.map((h) => h.id)
  const checkinRows: HabitCheckinRow[] = habitIds.length
    ? unwrap<HabitCheckinRow[]>(await supabase.from('habit_checkins').select().in('habit_id', habitIds))
    : []
  const progress = weeklyProgressByHabit(checkinRows)

  const photos: Record<string, string> = {}
  for (const c of children) {
    if (c.photo_url) photos[c.id] = c.photo_url
  }

  // Homework is fetched separately and tolerantly: if the `homework` table
  // hasn't been created yet (supabase/homework.sql), fall back to an empty list
  // instead of breaking the whole state load.
  let homeworkList: Homework[] = []
  try {
    homeworkList = unwrap<HomeworkRow[]>(
      await supabase.from('homework').select().in('child_id', childIds),
    ).map(toHomework)
  } catch (err) {
    console.warn('[supabase] homework table not available yet', err)
  }

  // Blog posts are family-scoped and also fetched tolerantly (supabase/blog.sql).
  // If the table doesn't exist yet, fall back to the seed articles so the blog
  // is never empty (the classic card design still shows).
  let blogList: BlogPost[]
  try {
    blogList = unwrap<BlogPostRow[]>(
      await supabase.from('blog_posts').select().eq('family_id', familyId).order('created_at'),
    ).map(toBlogPost)
  } catch (err) {
    console.warn('[supabase] blog_posts table not available yet', err)
    blogList = initialBlogPosts
  }

  // About page prose (one shared row per family; resilient like the others).
  let aboutContent: AboutContent = defaultAboutContent
  try {
    const rows = unwrap<{ content: AboutContent }[]>(
      await supabase.from('about_content').select('content').eq('family_id', familyId).limit(1),
    )
    if (rows.length && rows[0].content) {
      aboutContent = { ...defaultAboutContent, ...rows[0].content }
    }
  } catch (err) {
    console.warn('[supabase] about_content table not available yet', err)
  }

  return {
    students: children.map(toStudent),
    scores: unwrap<ScoreRow[]>(scores).map(toScore),
    goals: unwrap<AcademicGoalRow[]>(goals).map(toGoal),
    rewards: unwrap<RewardRow[]>(rewards).map(toReward),
    habitGoals: habitRows.map((h) => toHabitGoal(h, progress.get(h.id) ?? 0)),
    journal: unwrap<JournalEntryRow[]>(journal).map(toJournalEntry),
    checkIns: [
      ...new Set(unwrap<DailyCheckinRow[]>(checkins).map((c) => c.checkin_date)),
    ].sort(),
    growthHistory: unwrap<WeeklySnapshotRow[]>(snapshots).map(toGrowthSnapshot),
    encouragements: unwrap<EncouragementRow[]>(encouragements).map(toEncouragement),
    homework: homeworkList,
    blogPosts: blogList,
    aboutContent,
    photos,
  }
}

/* ------------------------------------------------------------------ */
/* Children                                                            */
/* ------------------------------------------------------------------ */

export async function addChild(
  familyId: string,
  child: Omit<Student, 'id' | 'parentId'>,
): Promise<Student> {
  const row = unwrap<ChildRow>(
    await supabase
      .from('children')
      .insert({
        family_id: familyId,
        name: child.name,
        grade: child.grade,
        avatar: child.avatar,
        color: child.color,
        birth_year: child.birthYear ?? null,
      })
      .select()
      .single(),
  )
  return toStudent(row)
}

export async function updateChildGrade(id: string, grade: string): Promise<void> {
  unwrap(await supabase.from('children').update({ grade }).eq('id', id).select().single())
}

export async function setChildAvatar(id: string, avatar: string): Promise<void> {
  unwrap(await supabase.from('children').update({ avatar }).eq('id', id).select().single())
}

export async function deleteChild(id: string): Promise<void> {
  unwrap(await supabase.from('children').delete().eq('id', id).select())
}

/**
 * Upload a child's photo (from a data URL) to the `child-photos` bucket and
 * record its public URL on the child row. Returns the (cache-busted) URL.
 * Path is `${familyId}/${childId}` so it overwrites on re-upload.
 */
export async function uploadChildPhoto(
  familyId: string,
  childId: string,
  dataUrl: string,
): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob()
  const contentType = blob.type || 'image/png'
  const path = `${familyId}/${childId}`
  const up = await supabase.storage
    .from('child-photos')
    .upload(path, blob, { upsert: true, contentType })
  if (up.error) throw new Error(`[supabase] ${up.error.message}`)

  const { data } = supabase.storage.from('child-photos').getPublicUrl(path)
  const url = `${data.publicUrl}?v=${Date.now()}` // cache-bust so updates show
  unwrap(await supabase.from('children').update({ photo_url: url }).eq('id', childId).select().single())
  return url
}

/* ------------------------------------------------------------------ */
/* Scores                                                              */
/* ------------------------------------------------------------------ */

export async function addScore(entry: Omit<ScoreEntry, 'id'>): Promise<ScoreEntry> {
  const row = unwrap<ScoreRow>(
    await supabase
      .from('scores')
      .insert({
        child_id: entry.studentId,
        subject: entry.subject,
        score: entry.score,
        max_score: entry.maxScore ?? 10,
        score_date: entry.date,
        semester: entry.semester,
        grade_level: entry.grade ?? null,
        term: entry.term ?? null,
        notes: entry.notes ?? null,
      })
      .select()
      .single(),
  )
  return toScore(row)
}

export async function updateScoreValue(id: string, score: number): Promise<void> {
  unwrap(await supabase.from('scores').update({ score }).eq('id', id).select().single())
}

export async function deleteScore(id: string): Promise<void> {
  unwrap(await supabase.from('scores').delete().eq('id', id).select())
}

/** Shift every score of a subject so the child's average lands on `target`. */
export async function setSubjectAverage(
  studentId: string,
  subject: string,
  target: number,
): Promise<void> {
  const rows = unwrap<{ id: string; score: number }[]>(
    await supabase
      .from('scores')
      .select('id, score')
      .eq('child_id', studentId)
      .eq('subject', subject),
  )
  if (rows.length === 0) return
  const currentAvg = rows.reduce((sum, r) => sum + r.score, 0) / rows.length
  const delta = Math.round(target) - Math.round(currentAvg)
  if (delta === 0) return
  await Promise.all(
    rows.map((r) =>
      supabase
        .from('scores')
        .update({ score: Math.max(0, Math.min(10, r.score + delta)) })
        .eq('id', r.id),
    ),
  )
}

/* ------------------------------------------------------------------ */
/* Academic goals (+ linked reward claim state)                        */
/* ------------------------------------------------------------------ */

export async function addGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
  const row = unwrap<AcademicGoalRow>(
    await supabase
      .from('academic_goals')
      .insert({
        child_id: goal.studentId,
        title: goal.title,
        subject: goal.subject ?? null,
        target_score: goal.targetScore ?? null,
        reward_id: goal.rewardId || null,
        points: goal.points,
        done: goal.done,
        done_at: goal.done ? new Date().toISOString() : null,
      })
      .select()
      .single(),
  )
  return toGoal(row)
}

export async function updateGoal(id: string, patch: Partial<Omit<Goal, 'id'>>): Promise<void> {
  const dbPatch: UpdateOf<AcademicGoalRow> = {}
  if (patch.title !== undefined) dbPatch.title = patch.title
  if (patch.subject !== undefined) dbPatch.subject = patch.subject ?? null
  if (patch.targetScore !== undefined) dbPatch.target_score = patch.targetScore ?? null
  if (patch.rewardId !== undefined) dbPatch.reward_id = patch.rewardId || null
  if (patch.points !== undefined) dbPatch.points = patch.points
  if (patch.done !== undefined) {
    dbPatch.done = patch.done
    dbPatch.done_at = patch.done ? new Date().toISOString() : null
  }
  if (Object.keys(dbPatch).length === 0) return
  unwrap(await supabase.from('academic_goals').update(dbPatch).eq('id', id).select().single())
}

/** Toggle a goal's completion and mirror the state onto its linked reward. */
export async function toggleGoal(goalId: string): Promise<void> {
  const goal = unwrap<{ done: boolean; reward_id: string | null }>(
    await supabase.from('academic_goals').select('done, reward_id').eq('id', goalId).single(),
  )
  const nowDone = !goal.done
  unwrap(
    await supabase
      .from('academic_goals')
      .update({ done: nowDone, done_at: nowDone ? new Date().toISOString() : null })
      .eq('id', goalId)
      .select()
      .single(),
  )
  if (goal.reward_id) {
    unwrap(
      await supabase
        .from('rewards')
        .update({ claimed: nowDone })
        .eq('id', goal.reward_id)
        .select()
        .single(),
    )
  }
}

export async function deleteGoal(id: string): Promise<void> {
  unwrap(await supabase.from('academic_goals').delete().eq('id', id).select())
}

/* ------------------------------------------------------------------ */
/* Rewards                                                             */
/* ------------------------------------------------------------------ */

export async function addReward(
  familyId: string,
  reward: Omit<Reward, 'id' | 'claimed'>,
): Promise<Reward> {
  const row = unwrap<RewardRow>(
    await supabase
      .from('rewards')
      .insert({
        family_id: familyId,
        name: reward.name,
        icon: reward.icon,
        cost: reward.cost,
        category: reward.category ?? null,
      })
      .select()
      .single(),
  )
  return toReward(row)
}

export async function setRewardClaimed(id: string, claimed: boolean): Promise<void> {
  unwrap(await supabase.from('rewards').update({ claimed }).eq('id', id).select().single())
}

/* ------------------------------------------------------------------ */
/* Habits + check-ins                                                  */
/* ------------------------------------------------------------------ */

export async function addHabit(habit: Omit<HabitGoal, 'id'>): Promise<HabitGoal> {
  const row = unwrap<HabitRow>(
    await supabase
      .from('habits')
      .insert({
        child_id: habit.studentId,
        name: habit.activity,
        icon: habit.icon,
        unit: habit.unit,
        target_weekly_value: habit.weeklyTarget,
      })
      .select()
      .single(),
  )
  if (habit.weeklyProgress > 0) {
    await addHabitCheckin(row.id, habit.weeklyProgress)
  }
  return toHabitGoal(row, habit.weeklyProgress ?? 0)
}

export async function updateHabit(
  id: string,
  patch: Partial<Pick<HabitGoal, 'activity' | 'icon' | 'unit' | 'weeklyTarget'>>,
): Promise<void> {
  const dbPatch: UpdateOf<HabitRow> = {}
  if (patch.activity !== undefined) dbPatch.name = patch.activity
  if (patch.icon !== undefined) dbPatch.icon = patch.icon
  if (patch.unit !== undefined) dbPatch.unit = patch.unit
  if (patch.weeklyTarget !== undefined) dbPatch.target_weekly_value = patch.weeklyTarget
  if (Object.keys(dbPatch).length === 0) return
  unwrap(await supabase.from('habits').update(dbPatch).eq('id', id).select().single())
}

export async function deleteHabit(id: string): Promise<void> {
  unwrap(await supabase.from('habits').delete().eq('id', id).select())
}

/** Log a single habit check-in (adds to this week's progress). */
export async function addHabitCheckin(
  habitId: string,
  value: number,
  date: string = isoDay(new Date()),
): Promise<void> {
  unwrap(
    await supabase
      .from('habit_checkins')
      .insert({ habit_id: habitId, value, checkin_date: date })
      .select()
      .single(),
  )
}

/**
 * Bridge for the current UI's single `weeklyProgress` number: replace this
 * week's check-ins with one aggregate entry so the displayed value matches.
 */
export async function setHabitWeeklyProgress(habitId: string, value: number): Promise<void> {
  const monday = currentMonday()
  unwrap(
    await supabase
      .from('habit_checkins')
      .delete()
      .eq('habit_id', habitId)
      .gte('checkin_date', monday)
      .select(),
  )
  if (value > 0) await addHabitCheckin(habitId, value)
}

/* ------------------------------------------------------------------ */
/* Journal                                                             */
/* ------------------------------------------------------------------ */

export async function addJournalEntry(entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
  const row = unwrap<JournalEntryRow>(
    await supabase
      .from('journal_entries')
      .insert({
        child_id: entry.studentId,
        entry_date: entry.date,
        went_well: entry.wentWell,
        to_improve: entry.toImprove,
        next_goals: entry.nextGoals,
        parent_reflection: entry.parentReflection,
      })
      .select()
      .single(),
  )
  return toJournalEntry(row)
}

export async function deleteJournalEntry(id: string): Promise<void> {
  unwrap(await supabase.from('journal_entries').delete().eq('id', id).select())
}

/* ------------------------------------------------------------------ */
/* Daily check-ins (streak)                                            */
/* ------------------------------------------------------------------ */

/** Record a daily check-in for a child (idempotent via the unique index). */
export async function recordDailyCheckin(
  childId: string,
  date: string = isoDay(new Date()),
): Promise<void> {
  unwrap(
    await supabase
      .from('daily_checkins')
      .upsert({ child_id: childId, checkin_date: date }, { onConflict: 'child_id,checkin_date' })
      .select(),
  )
}

/* ------------------------------------------------------------------ */
/* Weekly growth snapshots                                             */
/* ------------------------------------------------------------------ */

/** Upsert the growth snapshot for the ISO week containing `date`. */
export async function upsertGrowthSnapshot(
  childId: string,
  date: string,
  growthScore: number,
  academicScore: number | null = null,
  habitScore: number | null = null,
): Promise<void> {
  const d = new Date(date)
  unwrap(
    await supabase
      .from('weekly_snapshots')
      .upsert(
        {
          child_id: childId,
          year: d.getFullYear(),
          week_number: isoWeek(d),
          week_start: date,
          growth_score: growthScore,
          academic_score: academicScore,
          habit_score: habitScore,
        },
        { onConflict: 'child_id,year,week_number' },
      )
      .select(),
  )
}

/* ------------------------------------------------------------------ */
/* Encouragements                                                      */
/* ------------------------------------------------------------------ */

export async function addEncouragement(
  entry: Omit<Encouragement, 'id'>,
): Promise<Encouragement> {
  const row = unwrap<EncouragementRow>(
    await supabase
      .from('encouragements')
      .insert({
        child_id: entry.studentId,
        message: entry.message,
        author: entry.from,
        created_at: entry.date ? new Date(entry.date).toISOString() : undefined,
      })
      .select()
      .single(),
  )
  return toEncouragement(row)
}

export async function deleteEncouragement(id: string): Promise<void> {
  unwrap(await supabase.from('encouragements').delete().eq('id', id).select())
}

/* ------------------------------------------------------------------ */
/* Homework                                                            */
/* ------------------------------------------------------------------ */

export async function addHomework(hw: Omit<Homework, 'id'>): Promise<Homework> {
  const row = unwrap<HomeworkRow>(
    await supabase
      .from('homework')
      .insert({
        child_id: hw.studentId,
        title: hw.title,
        subject: hw.subject ?? null,
        description: hw.description ?? null,
        due_date: hw.dueDate ?? null,
        done: hw.done,
        done_at: hw.done ? new Date().toISOString() : null,
      })
      .select()
      .single(),
  )
  return toHomework(row)
}

export async function toggleHomework(id: string): Promise<void> {
  const hw = unwrap<{ done: boolean }>(
    await supabase.from('homework').select('done').eq('id', id).single(),
  )
  const nowDone = !hw.done
  unwrap(
    await supabase
      .from('homework')
      .update({ done: nowDone, done_at: nowDone ? new Date().toISOString() : null })
      .eq('id', id)
      .select()
      .single(),
  )
}

export async function updateHomework(
  id: string,
  patch: Partial<Omit<Homework, 'id' | 'studentId'>>,
): Promise<void> {
  const dbPatch: UpdateOf<HomeworkRow> = {}
  if (patch.title !== undefined) dbPatch.title = patch.title
  if (patch.subject !== undefined) dbPatch.subject = patch.subject ?? null
  if (patch.description !== undefined) dbPatch.description = patch.description ?? null
  if (patch.dueDate !== undefined) dbPatch.due_date = patch.dueDate ?? null
  if (patch.done !== undefined) {
    dbPatch.done = patch.done
    dbPatch.done_at = patch.done ? new Date().toISOString() : null
  }
  if (Object.keys(dbPatch).length === 0) return
  unwrap(await supabase.from('homework').update(dbPatch).eq('id', id).select().single())
}

export async function deleteHomework(id: string): Promise<void> {
  unwrap(await supabase.from('homework').delete().eq('id', id).select())
}

/* ------------------------------------------------------------------ */
/* Blog posts (family-scoped)                                          */
/* ------------------------------------------------------------------ */

export async function addBlogPost(
  familyId: string,
  post: Omit<BlogPost, 'id'>,
): Promise<BlogPost> {
  const row = unwrap<BlogPostRow>(
    await supabase
      .from('blog_posts')
      .insert({
        family_id: familyId,
        title: post.title,
        excerpt: post.excerpt ?? null,
        date_label: post.date ?? null,
        read_mins: post.readMins,
        emoji: post.emoji ?? null,
        color: post.color ?? null,
        tag: post.tag ?? null,
        image_url: post.imageUrl ?? null,
      })
      .select()
      .single(),
  )
  return toBlogPost(row)
}

export async function updateBlogPost(
  id: string,
  patch: Partial<Omit<BlogPost, 'id'>>,
): Promise<void> {
  const dbPatch: UpdateOf<BlogPostRow> = {}
  if (patch.title !== undefined) dbPatch.title = patch.title
  if (patch.excerpt !== undefined) dbPatch.excerpt = patch.excerpt ?? null
  if (patch.date !== undefined) dbPatch.date_label = patch.date ?? null
  if (patch.readMins !== undefined) dbPatch.read_mins = patch.readMins
  if (patch.emoji !== undefined) dbPatch.emoji = patch.emoji ?? null
  if (patch.color !== undefined) dbPatch.color = patch.color ?? null
  if (patch.tag !== undefined) dbPatch.tag = patch.tag ?? null
  if (patch.imageUrl !== undefined) dbPatch.image_url = patch.imageUrl || null
  if (Object.keys(dbPatch).length === 0) return
  unwrap(await supabase.from('blog_posts').update(dbPatch).eq('id', id).select().single())
}

export async function deleteBlogPost(id: string): Promise<void> {
  unwrap(await supabase.from('blog_posts').delete().eq('id', id).select())
}

/* ------------------------------------------------------------------ */
/* About page content (one shared row per family)                      */
/* ------------------------------------------------------------------ */

export async function upsertAboutContent(
  familyId: string,
  content: AboutContent,
): Promise<void> {
  unwrap(
    await supabase
      .from('about_content')
      .upsert({ family_id: familyId, content }, { onConflict: 'family_id' })
      .select(),
  )
}

/**
 * Upload the About hero photo (from a data URL) to the shared photo bucket and
 * return its public URL. Reuses the `child-photos` bucket; path `${familyId}/about-hero`.
 */
export async function uploadAboutPhoto(familyId: string, dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob()
  const contentType = blob.type || 'image/png'
  const path = `${familyId}/about-hero`
  const up = await supabase.storage
    .from('child-photos')
    .upload(path, blob, { upsert: true, contentType })
  if (up.error) throw new Error(`[supabase] ${up.error.message}`)
  const { data } = supabase.storage.from('child-photos').getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}` // cache-bust so updates show
}

/** Upload a blog banner photo; unique path so each post keeps its own image. */
export async function uploadBlogPhoto(familyId: string, dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob()
  const contentType = blob.type || 'image/png'
  const path = `${familyId}/blog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const up = await supabase.storage
    .from('child-photos')
    .upload(path, blob, { upsert: true, contentType })
  if (up.error) throw new Error(`[supabase] ${up.error.message}`)
  const { data } = supabase.storage.from('child-photos').getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */

/** Grant a badge (idempotent via the (child_id, badge_type) unique index). */
export async function grantAchievement(
  childId: string,
  badgeType: string,
  meta: Record<string, unknown> | null = null,
): Promise<void> {
  unwrap(
    await supabase
      .from('achievements')
      .upsert({ child_id: childId, badge_type: badgeType, meta }, { onConflict: 'child_id,badge_type' })
      .select(),
  )
}

/* ------------------------------------------------------------------ */
/* Auth bootstrap                                                      */
/* ------------------------------------------------------------------ */

/** Ensure a `users` profile row exists for the signed-in auth user. */
export async function ensureUserProfile(user: {
  id: string
  email: string
  displayName?: string | null
}): Promise<void> {
  unwrap(
    await supabase
      .from('users')
      .upsert(
        { id: user.id, email: user.email, display_name: user.displayName ?? null },
        { onConflict: 'id' },
      )
      .select(),
  )
}

/**
 * Return the user's family id, creating a family (and owner membership) on
 * first sign-in. Assumes `ensureUserProfile` has already run.
 */
export async function getOrCreateFamily(
  userId: string,
  familyName = 'My Family',
): Promise<string> {
  const memberships = unwrap<{ family_id: string }[]>(
    await supabase.from('family_members').select('family_id').eq('user_id', userId).limit(1),
  )
  if (memberships.length > 0) return memberships[0].family_id

  const family = unwrap<{ id: string }>(
    await supabase
      .from('families')
      .insert({ name: familyName, owner_user_id: userId })
      .select('id')
      .single(),
  )
  unwrap(
    await supabase
      .from('family_members')
      .insert({ family_id: family.id, user_id: userId, role: 'owner' })
      .select(),
  )
  return family.id
}

/* ------------------------------------------------------------------ */
/* One-time migration: localStorage -> Supabase                        */
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
  photos: number
}

/**
 * Copy the current browser's localStorage data into Supabase under `familyId`.
 *
 * Local string ids (`s1`, `r1`, …) are remapped to the UUIDs the DB generates,
 * so `goals.rewardId` and every `studentId` reference stays intact. Run this
 * once per family after creating the family row and signing in (RLS applies).
 *
 * The family's `rewards`, `children`, … must be empty first to avoid duplicates.
 */
export async function migrateLocalStorageToSupabase(
  familyId: string,
): Promise<MigrationSummary> {
  const students = loadState<Student[]>(STORAGE_KEYS.students, [])
  const scores = loadState<ScoreEntry[]>(STORAGE_KEYS.scores, [])
  const goals = loadState<Goal[]>(STORAGE_KEYS.goals, [])
  const rewards = loadState<Reward[]>(STORAGE_KEYS.rewards, [])
  const habitGoals = loadState<HabitGoal[]>(STORAGE_KEYS.habitGoals, [])
  const journal = loadState<JournalEntry[]>(STORAGE_KEYS.journal, [])
  const checkIns = loadState<string[]>(STORAGE_KEYS.checkIns, [])
  const growthHistory = loadState<GrowthSnapshot[]>(STORAGE_KEYS.growthHistory, [])
  const encouragements = loadState<Encouragement[]>(STORAGE_KEYS.encouragements, [])
  const localPhotos = loadState<Record<string, string>>(STORAGE_KEYS.photos, {})

  // children (build local-id -> new-uuid map)
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

  // rewards (family-scoped) + preserve claimed state
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

  // scores
  let scoreCount = 0
  for (const sc of scores) {
    const childId = studentIdMap.get(sc.studentId)
    if (!childId) continue
    const { id: _id, studentId: _s, ...rest } = sc
    await addScore({ ...rest, studentId: childId })
    scoreCount++
  }

  // academic goals (+ remap reward)
  let goalCount = 0
  for (const g of goals) {
    const childId = studentIdMap.get(g.studentId)
    if (!childId) continue
    const { id: _id, studentId: _s, rewardId, ...rest } = g
    await addGoal({ ...rest, studentId: childId, rewardId: rewardIdMap.get(rewardId) ?? '' })
    goalCount++
  }

  // habits (weeklyProgress becomes a single check-in via addHabit)
  let habitCount = 0
  for (const h of habitGoals) {
    const childId = studentIdMap.get(h.studentId)
    if (!childId) continue
    const { id: _id, studentId: _s, ...rest } = h
    await addHabit({ ...rest, studentId: childId })
    habitCount++
  }

  // journal
  let journalCount = 0
  for (const j of journal) {
    const childId = studentIdMap.get(j.studentId)
    if (!childId) continue
    const { id: _id, studentId: _s, ...rest } = j
    await addJournalEntry({ ...rest, studentId: childId })
    journalCount++
  }

  // weekly growth snapshots
  let snapshotCount = 0
  for (const snap of growthHistory) {
    const childId = studentIdMap.get(snap.studentId)
    if (!childId) continue
    await upsertGrowthSnapshot(childId, snap.date, snap.score)
    snapshotCount++
  }

  // encouragements
  let encouragementCount = 0
  for (const e of encouragements) {
    const childId = studentIdMap.get(e.studentId)
    if (!childId) continue
    const { id: _id, studentId: _s, ...rest } = e
    await addEncouragement({ ...rest, studentId: childId })
    encouragementCount++
  }

  // daily check-ins were family-global in localStorage; attach to the first child
  let checkinCount = 0
  const firstChildId = studentIdMap.values().next().value
  if (firstChildId) {
    for (const date of checkIns) {
      await recordDailyCheckin(firstChildId, date)
      checkinCount++
    }
  }

  // photos (upload each child's local data-URL to Storage)
  let photoCount = 0
  for (const [localId, dataUrl] of Object.entries(localPhotos)) {
    const childId = studentIdMap.get(localId)
    if (!childId || !dataUrl) continue
    try {
      await uploadChildPhoto(familyId, childId, dataUrl)
      photoCount++
    } catch (err) {
      console.error('[supabase] photo upload failed', err)
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
    photos: photoCount,
  }
}
