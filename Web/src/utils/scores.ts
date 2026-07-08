import type { ScoreEntry } from '../types'

export function averageScore(scores: ScoreEntry[]): number {
  if (scores.length === 0) return 0
  const total = scores.reduce((sum, s) => sum + s.score, 0)
  return Math.round(total / scores.length)
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
