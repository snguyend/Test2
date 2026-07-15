/** Local ISO date (YYYY-MM-DD) for a given Date, in the user's timezone. */
function isoDay(d: Date): string {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return tz.toISOString().slice(0, 10)
}

export function todayIso(): string {
  return isoDay(new Date())
}

/**
 * Current consecutive-day streak from a list of check-in date strings.
 * Counts back from today; if today has no check-in yet but yesterday does,
 * the streak still counts (so the streak only breaks after a full missed day).
 */
export function currentStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const set = new Set(dates)
  const cursor = new Date()
  if (!set.has(isoDay(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!set.has(isoDay(cursor))) return 0
  }
  let streak = 0
  while (set.has(isoDay(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
