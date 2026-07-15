import type { Student } from '../types'

/** Grades each child can be tracked across (by student id). */
export const GRADE_OPTIONS: Record<string, number[]> = {
  s1: [8, 9, 10, 11, 12],
  s2: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
}

/** Fallback range used for any student not listed above. */
const DEFAULT_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/** Grades available for a given student. */
export function gradeOptionsFor(studentId: string): number[] {
  return GRADE_OPTIONS[studentId] ?? DEFAULT_GRADES
}

/** Pull the grade number out of a label like "Grade 8" or "Preparing for Grade 8". */
export function gradeNumber(grade: string): number | undefined {
  const match = grade.match(/\d+/)
  return match ? Number(match[0]) : undefined
}

/** The student's current grade as a number (falls back to their first option). */
export function currentGrade(student: Student): number {
  return gradeNumber(student.grade) ?? gradeOptionsFor(student.id)[0]
}

/** Human-friendly label for a grade number. */
export function gradeLabel(grade: number): string {
  return `Grade ${grade}`
}

/**
 * The academic-year start year for a student's *current* grade.
 * A school year runs Sep → May, so from June onward it's the upcoming year.
 */
function baseSchoolYear(now: Date = new Date()): number {
  return now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1
}

export interface SchoolYear {
  startYear: number
  endYear: number
  start: Date // ~Sep 5
  end: Date // ~May 30
  label: string // e.g. "2026–2027"
  range: string // e.g. "Sep 5, 2026 → May 30, 2027"
}

/**
 * Map a grade to its school year for a student, anchored so the student's
 * current grade lands in the current/upcoming academic year (Sep 5 → May 30).
 * e.g. current Grade 8 → Sep 5, 2026 → May 30, 2027.
 */
export function schoolYearForGrade(student: Student, grade: number, now: Date = new Date()): SchoolYear {
  const startYear = baseSchoolYear(now) + (grade - currentGrade(student))
  const endYear = startYear + 1
  const start = new Date(startYear, 8, 5) // Sep 5
  const end = new Date(endYear, 4, 30) // May 30
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return {
    startYear,
    endYear,
    start,
    end,
    label: `${startYear}–${endYear}`,
    range: `${fmt(start)} → ${fmt(end)}`,
  }
}

