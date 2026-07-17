import { useEffect } from 'react'
import { useAppData } from '../store-context'
import { academicScore, habitScore, growthScore } from '../utils/growth'
import { computeBadgeGroups, allBadgesOf } from '../utils/badges'

interface FamilyCelebrationProps {
  onClose: () => void
}

/**
 * End-of-month Family Celebration: each child's achievements, badges unlocked,
 * goal completion, and an overall family achievement — framed positively.
 */
export default function FamilyCelebration({ onClose }: FamilyCelebrationProps) {
  const { students, scores, goals, habitGoals } = useAppData()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const totalGoals = goals.length
  const doneGoals = goals.filter((g) => g.done).length
  const familyGoalPct = totalGoals ? Math.round((doneGoals / totalGoals) * 100) : 0

  const perChild = students.map((s) => {
    const own = scores.filter((x) => x.studentId === s.id)
    const habits = habitGoals.filter((h) => h.studentId === s.id)
    const ownGoals = goals.filter((g) => g.studentId === s.id)
    const groups = computeBadgeGroups(own, habits, ownGoals)
    const earned = allBadgesOf(groups).filter((b) => b.earned)
    const growth = growthScore(academicScore(own), habitScore(habits))
    const goalDone = ownGoals.filter((g) => g.done).length
    const goalPct = ownGoals.length ? Math.round((goalDone / ownGoals.length) * 100) : 0
    return { student: s, earned, growth, goalDone, goalTotal: ownGoals.length, goalPct }
  })

  return (
    <div className="goal-modal-backdrop" onClick={onClose}>
      <div
        className="goal-modal card celebration"
        role="dialog"
        aria-modal="true"
        aria-label="Monthly family celebration"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="goal-modal-head">
          <h2>🎉 Monthly Family Celebration</h2>
          <button className="goal-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="celebration-hero">
          <span className="celebration-confetti" aria-hidden="true">
            🎊
          </span>
          <p className="celebration-month">{month}</p>
          <p className="celebration-headline">
            The whole family completed <strong>{familyGoalPct}%</strong> of this month's goals!
          </p>
          <div className="celebration-bar">
            <span className="celebration-bar-fill" style={{ width: `${familyGoalPct}%` }} />
          </div>
          <p className="muted">
            {doneGoals} of {totalGoals} goals achieved together 🙌
          </p>
        </div>

        <div className="celebration-children">
          {perChild.map(({ student, earned, growth, goalDone, goalTotal, goalPct }) => (
            <div
              key={student.id}
              className="celebration-child"
              style={{ borderTopColor: student.color }}
            >
              <div className="celebration-child-head">
                <span className="celebration-avatar" style={{ background: student.color }}>
                  {student.avatar}
                </span>
                <div>
                  <strong>{student.name}</strong>
                  <span className="muted celebration-grade">{student.grade}</span>
                </div>
              </div>

              <div className="celebration-stats">
                <div>
                  <span className="celebration-stat-value">{growth.toFixed(1)}</span>
                  <span className="celebration-stat-label">Growth /10</span>
                </div>
                <div>
                  <span className="celebration-stat-value">
                    {goalDone}/{goalTotal}
                  </span>
                  <span className="celebration-stat-label">Goals ({goalPct}%)</span>
                </div>
                <div>
                  <span className="celebration-stat-value">{earned.length}</span>
                  <span className="celebration-stat-label">Badges</span>
                </div>
              </div>

              <div className="celebration-badges">
                {earned.length === 0 ? (
                  <span className="muted">Keep going — new badges are within reach! 💪</span>
                ) : (
                  earned.map((b) => (
                    <span key={b.name} className="celebration-badge" title={b.desc}>
                      {b.icon} {b.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="btn primary celebration-done" onClick={onClose}>
          🎉 Celebrate!
        </button>
      </div>
    </div>
  )
}
