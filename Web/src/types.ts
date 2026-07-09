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
