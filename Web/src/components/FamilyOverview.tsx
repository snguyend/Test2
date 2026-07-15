import { useMemo, useState } from 'react'
import { useAppData } from '../store-context'
import { averageScore } from '../utils/scores'
import { academicScore, habitScore, growthScore } from '../utils/growth'
import GoalManager from './GoalManager'

interface WindowStat {
  count: number
  avg: number
  delta: number
}

/**
 * Family-level overview shown at the top of the home dashboard.
 * Three cards: Family Goals, Family Achievements, and Family Growth Snapshot.
 */
export default function FamilyOverview() {
  const { students, scores, goals, rewards, habitGoals } = useAppData()
  const [managerOpen, setManagerOpen] = useState(false)

  const stats = useMemo(() => {
    // Family growth score (0-10) = average of each child's growth (Academic 70% + Habit 30%).
    const perStudentGrowth = students
      .map((s) =>
        growthScore(
          academicScore(scores.filter((x) => x.studentId === s.id)),
          habitScore(habitGoals.filter((h) => h.studentId === s.id)),
        ),
      )
      .filter((_, i) => scores.some((x) => x.studentId === students[i].id))
    const growth =
      perStudentGrowth.length > 0
        ? Math.round((perStudentGrowth.reduce((a, b) => a + b, 0) / perStudentGrowth.length) * 10) / 10
        : 0

    // Semester-over-semester improvement used as the growth trend signal.
    const firstAvg = averageScore(scores.filter((s) => s.semester === 'first'))
    const secondAvg = averageScore(scores.filter((s) => s.semester === 'second'))
    const trend = firstAvg > 0 ? Math.round((secondAvg - firstAvg) * 10) / 10 : 0

    // Goals
    const totalGoals = goals.length
    const doneGoals = goals.filter((g) => g.done).length
    const goalPct = totalGoals ? Math.round((doneGoals / totalGoals) * 100) : 0

    // Achievements
    const perfectScores = [...scores]
      .filter((s) => s.score === 10)
      .sort((a, b) => b.date.localeCompare(a.date))
    const completedGoals = goals.filter((g) => g.done)
    const claimedRewards = rewards.filter((r) => r.claimed)
    const pointsEarned = completedGoals.reduce((sum, g) => sum + g.points, 0)

    // Newest achievement (used for the "NEW" badge)
    const newest = perfectScores[0]
    const newestStudent = newest ? students.find((s) => s.id === newest.studentId) : undefined

    // Outstanding: highest-average child + their best subject
    const ranked = students
      .map((s) => {
        const own = scores.filter((x) => x.studentId === s.id)
        return { student: s, avg: averageScore(own), records: own.length }
      })
      .filter((r) => r.records > 0)
      .sort((a, b) => b.avg - a.avg)
    const outstanding = ranked[0]

    // Week / month windows, relative to the latest recorded activity so the
    // snapshot stays meaningful even when data is imported historically.
    const refDate = scores.length
      ? scores.reduce((m, s) => (s.date > m ? s.date : m), scores[0].date)
      : new Date().toISOString().slice(0, 10)

    const windowStat = (days: number): WindowStat => {
      const end = new Date(refDate)
      const start = new Date(end)
      start.setDate(start.getDate() - days)
      const prevStart = new Date(start)
      prevStart.setDate(prevStart.getDate() - days)

      const within = (from: Date, to: Date) =>
        scores.filter((s) => {
          const d = new Date(s.date)
          return d > from && d <= to
        })

      const current = within(start, end)
      const previous = within(prevStart, start)
      const delta =
        previous.length > 0
          ? Math.round((averageScore(current) - averageScore(previous)) * 10) / 10
          : 0
      return { count: current.length, avg: averageScore(current), delta }
    }

    return {
      growthScore: growth,
      trend,
      totalGoals,
      doneGoals,
      goalPct,
      perfectCount: perfectScores.length,
      completedGoalsCount: completedGoals.length,
      claimedCount: claimedRewards.length,
      pointsEarned,
      newest,
      newestStudent,
      outstanding,
      week: windowStat(7),
      month: windowStat(30),
    }
  }, [students, scores, goals, rewards, habitGoals])

  const perChildGoals = useMemo(
    () =>
      students.map((s) => {
        const own = goals.filter((g) => g.studentId === s.id)
        const done = own.filter((g) => g.done).length
        return {
          student: s,
          done,
          total: own.length,
          pct: own.length ? Math.round((done / own.length) * 100) : 0,
        }
      }),
    [students, goals],
  )

  const goalRing = {
    background: `conic-gradient(var(--primary) ${stats.goalPct * 3.6}deg, color-mix(in srgb, var(--text) 12%, transparent) 0deg)`,
  }

  const trendLabel = (n: number) => (n > 0 ? `▲ +${n}` : n < 0 ? `▼ ${n}` : '► 0')
  const trendClass = (n: number) => (n > 0 ? 'up' : n < 0 ? 'down' : 'flat')

  return (
    <section className="family-overview">
      <div className="family-grid">
        {/* 1. Family Goals */}
        <article className="card family-card family-goals">
          <h3 className="family-title">
            🎯 Family Goals
            <button
              type="button"
              className="family-manage-btn"
              onClick={() => setManagerOpen(true)}
            >
              ✏️ Manage
            </button>
          </h3>
          <div className="family-goals-body">
            <div className="goal-ring" style={goalRing}>
              <div className="goal-ring-inner">
                <span className="goal-ring-pct">{stats.goalPct}%</span>
                <span className="goal-ring-sub">complete</span>
              </div>
            </div>
            <div className="family-goals-side">
              <p className="family-goals-count">
                <strong>{stats.doneGoals}</strong> of {stats.totalGoals} goals achieved
              </p>
              {perChildGoals.map(({ student, done, total, pct }) => (
                <div key={student.id} className="mini-goal">
                  <span className="mini-goal-label">
                    {student.avatar} {student.name.split(' ').slice(-1)}
                  </span>
                  <span className="mini-goal-bar">
                    <span
                      className="mini-goal-fill"
                      style={{ width: `${pct}%`, background: student.color }}
                    />
                  </span>
                  <span className="mini-goal-num">
                    {done}/{total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* 2. Family Achievements */}
        <article className="card family-card family-achievements">
          <h3 className="family-title">🏆 Family Achievements</h3>

          {stats.newest && stats.newestStudent && (
            <div className="achieve-new">
              <span className="achieve-new-tag">NEW</span>
              <span className="achieve-new-icon">💯</span>
              <div>
                <strong>Perfect 10 in {stats.newest.subject}</strong>
                <span className="muted">
                  {stats.newestStudent.avatar} {stats.newestStudent.name} · {stats.newest.date}
                </span>
              </div>
            </div>
          )}

          <div className="badge-grid">
            <div className="badge-tile">
              <span className="badge-icon">🎯</span>
              <span className="badge-value">{stats.completedGoalsCount}</span>
              <span className="badge-label">Goals met</span>
            </div>
            <div className="badge-tile">
              <span className="badge-icon">💯</span>
              <span className="badge-value">{stats.perfectCount}</span>
              <span className="badge-label">Perfect 10s</span>
            </div>
            <div className="badge-tile">
              <span className="badge-icon">🎁</span>
              <span className="badge-value">{stats.claimedCount}</span>
              <span className="badge-label">Rewards</span>
            </div>
            <div className="badge-tile">
              <span className="badge-icon">⭐</span>
              <span className="badge-value">{stats.pointsEarned}</span>
              <span className="badge-label">Points</span>
            </div>
          </div>

          {stats.outstanding && (
            <p className="achieve-outstanding">
              🌟 Outstanding: {stats.outstanding.student.avatar}{' '}
              <strong>{stats.outstanding.student.name}</strong> — {stats.outstanding.avg} avg
            </p>
          )}
        </article>

        {/* 3. Family Growth Snapshot */}
        <article className="card family-card family-growth">
          <h3 className="family-title">📈 Family Growth Snapshot</h3>
          <div className="growth-score">
            <span className="growth-score-value">{stats.growthScore.toFixed(1)}</span>
            <span className="growth-score-max">/10</span>
            <span className={`growth-trend ${trendClass(stats.trend)}`}>{trendLabel(stats.trend)}</span>
          </div>
          <span className="muted growth-caption">Family growth score · Academic 70% + Habit 30%</span>

          <div className="growth-windows">
            <div className="growth-window">
              <span className="gw-label">This week</span>
              <span className="gw-value">{stats.week.avg || '—'}</span>
              <span className="gw-meta">
                {stats.week.count} new ·{' '}
                <span className={`gw-delta ${trendClass(stats.week.delta)}`}>
                  {trendLabel(stats.week.delta)}
                </span>
              </span>
            </div>
            <div className="growth-window">
              <span className="gw-label">This month</span>
              <span className="gw-value">{stats.month.avg || '—'}</span>
              <span className="gw-meta">
                {stats.month.count} new ·{' '}
                <span className={`gw-delta ${trendClass(stats.month.delta)}`}>
                  {trendLabel(stats.month.delta)}
                </span>
              </span>
            </div>
          </div>
        </article>
      </div>

      {managerOpen && <GoalManager onClose={() => setManagerOpen(false)} />}
    </section>
  )
}
