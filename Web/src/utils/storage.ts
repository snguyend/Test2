const PREFIX = 'eg-'

/** Namespaced localStorage keys used across the app. */
export const STORAGE_KEYS = {
  students: `${PREFIX}students`,
  scores: `${PREFIX}scores`,
  goals: `${PREFIX}goals`,
  rewards: `${PREFIX}rewards`,
  photos: `${PREFIX}student-photos`,
  checklist: `${PREFIX}checklist`,
  habitGoals: `${PREFIX}habit-goals`,
  journal: `${PREFIX}journal`,
  checkIns: `${PREFIX}check-ins`,
  growthHistory: `${PREFIX}growth-history`,
  schoolYears: `${PREFIX}school-years`,
  encouragements: `${PREFIX}encouragements`,
  homework: `${PREFIX}homework`,
  blogPosts: `${PREFIX}blog-posts`,
  aboutContent: `${PREFIX}about-content`,
} as const

/**
 * Read a JSON value from localStorage.
 * Returns `fallback` when the key is missing, empty, or cannot be parsed.
 */
export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/**
 * Write a JSON value to localStorage.
 * Silently ignores storage errors (e.g. quota exceeded or disabled storage).
 */
export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage errors (e.g. quota exceeded or private mode)
  }
}

/** Remove a single persisted key. */
export function clearState(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore storage errors
  }
}

/** Remove all app-owned persisted keys (resets to seed data on next load). */
export function clearAllState(): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    clearState(key)
  }
}
