import type { Goal, HabitGoal, ScoreEntry } from '../types'
import { semesterAverage } from './scores'

export interface Badge {
  icon: string
  name: string
  desc: string
  earned: boolean
}

export interface BadgeGroup {
  category: string
  icon: string
  hint: string
  badges: Badge[]
}

/**
 * Reward-system badges for a child, grouped by category.
 * Rewards effort, progress, and persistence — never competition.
 */
export function computeBadgeGroups(
  scores: ScoreEntry[],
  habits: HabitGoal[],
  goals: Goal[],
): BadgeGroup[] {
  const firstAvg = semesterAverage(scores, 'first')
  const secondAvg = semesterAverage(scores, 'second')
  const improvement = firstAvg > 0 ? Math.round((secondAvg - firstAvg) * 10) / 10 : 0

  const readingHabit = habits.find((h) => /read/i.test(h.activity))
  const homeworkHabit = habits.find((h) => /homework/i.test(h.activity))
  const readingHero = readingHabit ? readingHabit.weeklyProgress >= readingHabit.weeklyTarget : false
  const homeworkMaster = homeworkHabit
    ? homeworkHabit.weeklyProgress >= homeworkHabit.weeklyTarget
    : false
  const consistencyChampion =
    habits.length > 0 && habits.every((h) => h.weeklyProgress >= h.weeklyTarget)
  const goalCrusher = goals.filter((g) => g.done).length >= 3
  const risingStar = improvement > 0
  const mostImproved = improvement >= 0.3

  return [
    {
      category: 'Growth Badge',
      icon: '📈',
      hint: 'Rewards progress',
      badges: [
        { icon: '🚀', name: 'Most Improved', desc: 'Growth jumped noticeably this term', earned: mostImproved },
        { icon: '⭐', name: 'Rising Star', desc: 'Improved since last term', earned: risingStar },
      ],
    },
    {
      category: 'Consistency Badge',
      icon: '🔥',
      hint: 'Rewards persistence',
      badges: [
        { icon: '🔥', name: 'Consistency Champion', desc: 'Met every habit goal this week', earned: consistencyChampion },
      ],
    },
    {
      category: 'Habit Badge',
      icon: '📚',
      hint: 'Rewards effort',
      badges: [
        { icon: '📚', name: 'Reading Hero', desc: 'Hit the weekly reading target', earned: readingHero },
        { icon: '✏️', name: 'Homework Master', desc: 'Hit the weekly homework target', earned: homeworkMaster },
      ],
    },
    {
      category: 'Goal Badge',
      icon: '🎯',
      hint: 'Rewards follow-through',
      badges: [
        { icon: '🏆', name: 'Goal Crusher', desc: 'Completed 3 or more goals', earned: goalCrusher },
      ],
    },
  ]
}

export function allBadgesOf(groups: BadgeGroup[]): Badge[] {
  return groups.flatMap((g) => g.badges)
}
