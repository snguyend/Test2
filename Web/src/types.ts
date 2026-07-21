export interface Parent {
  id: string
  name: string
  email: string
}

export interface Student {
  id: string
  name: string
  grade: string
  avatar: string // emoji
  color: string
  parentId: string // links to a Parent
  birthYear?: number
}

export interface ScoreEntry {
  id: string
  studentId: string
  subject: string
  score: number // 0 - 10 (10 = highest score at school)
  maxScore?: number // defaults to 10 when omitted
  date: string // ISO date (YYYY-MM-DD)
  semester: 'first' | 'second'
  grade?: number // school grade the score was earned in (e.g. 8)
  term?: string // e.g. "Term 1", "Semester 2"
  notes?: string
}

export interface Reward {
  id: string
  name: string
  icon: string // emoji
  claimed: boolean
  cost: number // points required to claim the reward
  category?: string
}

export interface Goal {
  id: string
  studentId: string
  title: string
  rewardId: string // links to a Reward
  done: boolean
  subject?: string
  targetScore?: number // score needed to complete the goal
  points: number // points earned when the goal is completed
}

export interface HabitGoal {
  id: string
  studentId: string
  activity: string // e.g. "Reading", "Coding", "Piano", "Swimming"
  icon: string // emoji
  unit: string // any unit: minutes, sessions, pages, tasks, or custom
  weeklyTarget: number // target per week
  weeklyProgress: number // done so far this week
}

export interface JournalEntry {
  id: string
  studentId: string
  date: string // ISO date (YYYY-MM-DD)
  wentWell: string[] // ✅ What went well
  toImprove: string[] // 🎯 What to improve
  nextGoals: string[] // 🚀 Goals for next week
  parentReflection: string // ❤️ Parent reflection
}

export interface GrowthSnapshot {
  studentId: string
  date: string // ISO date of the week (Monday) the snapshot belongs to
  score: number // growth score 0–10 at close of that week
}

export interface SchoolYearOverride {
  start: string // ISO date
  end: string // ISO date
}

export interface Encouragement {
  id: string
  studentId: string
  from: string // who sent it, e.g. "Grandma", "Dad"
  message: string
  date: string // ISO date
}

export interface Homework {
  id: string
  studentId: string
  title: string
  subject?: string
  description?: string
  dueDate?: string // ISO date (YYYY-MM-DD)
  done: boolean
}

export interface BlogPost {
  id: string
  title: string
  excerpt: string
  date: string // display label, e.g. "Mar 4"
  readMins: number
  emoji: string
  color: string // hex accent for the banner
  tag: string
  /** Optional banner photo (public URL). Falls back to the emoji banner. */
  imageUrl?: string
}

/** Editable prose for the About page (one shared document per family). */
export interface AboutContent {
  heroTitle: string
  heroBody: string
  /** Optional hero photo (public URL or data URL). Falls back to the illustration. */
  heroImageUrl?: string
  /** CSS object-position for the hero photo, e.g. "50% 30%". */
  heroImagePosition?: string
  vision: string
  mission: string
  why: string
  who: string
  how: string
  outcome: string
}

