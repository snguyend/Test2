export interface Student {
  id: string
  name: string
  grade: string
  avatar: string // emoji
  color: string
}

export interface ScoreEntry {
  id: string
  studentId: string
  subject: string
  score: number // 0 - 100
  date: string // ISO date (YYYY-MM-DD)
}

export interface Reward {
  id: string
  name: string
  icon: string // emoji
  claimed: boolean
}

export interface Goal {
  id: string
  studentId: string
  title: string
  rewardId: string // links to a Reward
  done: boolean
}
