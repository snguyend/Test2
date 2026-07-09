import type { ScoreEntry } from '../types'

/** Highest score achievable at school. */
export const MAX_SCORE = 10

export function averageScore(scores: ScoreEntry[]): number {
  if (scores.length === 0) return 0
  const total = scores.reduce((sum, s) => sum + s.score, 0)
  return Math.round((total / scores.length) * 10) / 10
}

/** Average for a single semester ('first' | 'second'). */
export function semesterAverage(scores: ScoreEntry[], semester: 'first' | 'second'): number {
  return averageScore(scores.filter((s) => s.semester === semester))
}

/**
 * Colour legend for a score on the 0–10 scale:
 * - under 6  → orange (needs focus)
 * - 6 – 8    → light olive green (on track)
 * - 9 – 10   → green (excellent)
 */
export function scoreColor(value: number): string {
  if (value < 6) return '#f97316' // orange
  if (value < 9) return '#a3b435' // olive green light
  return '#22c55e' // green
}

export function subjectAverages(scores: ScoreEntry[]): { label: string; value: number }[] {
  const bySubject = new Map<string, ScoreEntry[]>()
  for (const s of scores) {
    const list = bySubject.get(s.subject) ?? []
    list.push(s)
    bySubject.set(s.subject, list)
  }
  return [...bySubject.entries()].map(([subject, list]) => ({
    label: subject,
    value: averageScore(list),
  }))
}
