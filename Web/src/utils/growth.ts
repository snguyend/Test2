import type { HabitGoal, ScoreEntry } from '../types'
import { averageScore } from './scores'

/** Academic score on a 0–10 scale (2 decimals). */
export function academicScore(scores: ScoreEntry[]): number {
  return Math.round(averageScore(scores) * 100) / 100
}

/** Habit score on a 0–10 scale (1 decimal), from average weekly completion. */
export function habitScore(habits: HabitGoal[]): number {
  if (habits.length === 0) return 0
  const avgPct =
    habits.reduce(
      (sum, h) =>
        sum + (h.weeklyTarget > 0 ? Math.min(100, (h.weeklyProgress / h.weeklyTarget) * 100) : 0),
      0,
    ) / habits.length
  return Math.round((avgPct / 10) * 10) / 10
}

/** Growth score = Academic 70% + Habit 30%, on a 0–10 scale (1 decimal). */
export function growthScore(academic: number, habit: number): number {
  return Math.round((academic * 0.7 + habit * 0.3) * 10) / 10
}

/** ISO week number (1–53) for a date. */
export function isoWeek(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/** The Monday date of a given ISO week in a given year. */
export function mondayOfIsoWeek(week: number, year: number = new Date().getFullYear()): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1))
  const monday = new Date(week1Monday)
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7)
  return monday
}

/** Short label for an ISO week, e.g. "W29 · Jul 13". */
export function weekLabel(week: number, year: number = new Date().getFullYear()): string {
  const monday = mondayOfIsoWeek(week, year)
  const md = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return `W${week} · ${md}`
}

/** Local ISO date string (YYYY-MM-DD) for a Date. */
export function isoDay(d: Date): string {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return tz.toISOString().slice(0, 10)
}

/** All Monday dates (week starts) between start and end, inclusive-ish. */
export function weekMondays(start: Date, end: Date): Date[] {
  const d = new Date(start)
  const dow = (d.getDay() + 6) % 7 // 0 = Monday
  d.setDate(d.getDate() - dow)
  const out: Date[] = []
  while (d <= end) {
    out.push(new Date(d))
    d.setDate(d.getDate() + 7)
  }
  return out
}

/** Short date label for a Monday, e.g. "Sep 8, 2026". */
export function dayLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
