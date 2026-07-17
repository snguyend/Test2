import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../store-context'
import Avatar from '../components/Avatar'
import BarChart from '../components/BarChart'
import LineChart from '../components/LineChart'
import Particles from '../components/Particles'
import Widgets from '../components/Widgets'
import FamilyOverview from '../components/FamilyOverview'
import QuickCheckIn from '../components/QuickCheckIn'
import FamilyCelebration from '../components/FamilyCelebration'
import { subjectAverages } from '../utils/scores'
import { academicScore, habitScore, growthScore } from '../utils/growth'
import { currentStreak } from '../utils/streak'
import { gradeOptionsFor, gradeNumber } from '../utils/grades'

export default function Dashboard() {
  const { students, scores, goals, habitGoals, checkIns, updateStudentGrade } = useAppData()
  const [filter, setFilter] = useState<string>('all')
  const [semester, setSemester] = useState<'all' | 'first' | 'second'>('all')
  const [gradeFilter, setGradeFilter] = useState<'all' | number>('all')
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [celebrationOpen, setCelebrationOpen] = useState(false)

  const activeStudent = students.find((s) => s.id === filter)
  const accent = activeStudent?.color

  // Grades that can be picked in the analytics filter (depends on the chosen student).
  const gradeChoices = useMemo(() => {
    const ids = filter === 'all' ? students.map((s) => s.id) : [filter]
    const set = new Set<number>()
    ids.forEach((id) => gradeOptionsFor(id).forEach((g) => set.add(g)))
    return [...set].sort((a, b) => a - b)
  }, [filter, students])

  const filteredScores = useMemo(
    () =>
      scores.filter(
        (s) =>
          (filter === 'all' || s.studentId === filter) &&
          (semester === 'all' || s.semester === semester) &&
          (gradeFilter === 'all' || s.grade === gradeFilter),
      ),
    [scores, filter, semester, gradeFilter],
  )

  const bySubject = useMemo(() => subjectAverages(filteredScores), [filteredScores])

  const timeline = useMemo(
    () =>
      [...filteredScores]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((s) => ({ label: s.date.slice(5), value: s.score })),
    [filteredScores],
  )

  const streak = currentStreak(checkIns)

  return (
    <div className="page">
      <section className="hero">
        <Particles className="particles-hero" />
        <div className="hero-text">
          <h1>Welcome back 👋</h1>
          <p>Track your children's learning journey, celebrate wins, and set new goals.</p>
        </div>
        <div className="hero-anim" aria-hidden="true">
          <span className="float f1">📚</span>
          <span className="float f2">✏️</span>
          <span className="float f3">🎓</span>
          <span className="float f4">⭐</span>
          <span className="float f5">🧮</span>
        </div>
      </section>

      <h1>Dashboard</h1>
      <p className="muted">A quick look at how everyone is doing.</p>

      <FamilyOverview />

      <h2 className="section-heading">👨‍👩‍👧‍👦 Children</h2>
      <div className="card-grid">
        {students.map((student) => {
          const studentScores = scores.filter((s) => s.studentId === student.id)
          const studentGoals = goals.filter((g) => g.studentId === student.id)
          const doneGoals = studentGoals.filter((g) => g.done).length
          const gradeOptions = gradeOptionsFor(student.id)
          const selectedGrade = gradeNumber(student.grade)

          const growthScoreVal = growthScore(
            academicScore(studentScores),
            habitScore(habitGoals.filter((h) => h.studentId === student.id)),
          )
          const goalPct = studentGoals.length
            ? Math.round((doneGoals / studentGoals.length) * 100)
            : 0

          const perfect = [...studentScores]
            .filter((s) => s.score === 10)
            .sort((a, b) => b.date.localeCompare(a.date))[0]
          const doneGoal = studentGoals.find((g) => g.done)
          const topScore = [...studentScores].sort((a, b) => b.score - a.score)[0]
          const recentAchievement = perfect
            ? `💯 Perfect 10 in ${perfect.subject}`
            : doneGoal
              ? `🏆 ${doneGoal.title}`
              : topScore
                ? `⭐ ${topScore.score}/10 in ${topScore.subject}`
                : 'Just getting started'

          return (
            <div key={student.id} className="card student-card">
              <div className="student-head">
                <Avatar student={student} editable />
                <div>
                  <Link to={`/students/${student.id}`} className="student-name-link">
                    <h2>{student.name}</h2>
                  </Link>
                  <span className="muted">{student.grade}</span>
                </div>
              </div>
              {gradeOptions.length > 0 && (
                <label className="grade-select">
                  <span>Grade</span>
                  <select
                    value={selectedGrade ?? ''}
                    onChange={(e) =>
                      updateStudentGrade(student.id, `Grade ${e.target.value}`)
                    }
                  >
                    {gradeOptions.map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="stat-row">
                <div className="stat">
                  <span className="stat-value">{growthScoreVal.toFixed(1)}</span>
                  <span className="stat-label">Growth</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{goalPct}%</span>
                  <span className="stat-label">Goals done</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {doneGoals}/{studentGoals.length}
                  </span>
                  <span className="stat-label">Goals</span>
                </div>
              </div>
              <div className="child-achievement" title="Most recent achievement">
                {recentAchievement}
              </div>
              <Link to={`/students/${student.id}`} className="card-link">
                View details →
              </Link>
            </div>
          )
        })}
      </div>

      <div className="dash-toolbar">
        <h2>Analytics</h2>
        <div className="dash-filters">
          <label className="dash-filter">
            <span>Student</span>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                setGradeFilter('all')
              }}
            >
              <option value="all">👨‍👩‍👧‍👦 All students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.avatar} {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="dash-filter">
            <span>Grade</span>
            <select
              value={gradeFilter}
              onChange={(e) =>
                setGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
            >
              <option value="all">All grades</option>
              {gradeChoices.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </label>
          <label className="dash-filter">
            <span>Semester</span>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as 'all' | 'first' | 'second')}
            >
              <option value="all">Overall</option>
              <option value="first">First semester</option>
              <option value="second">Second semester</option>
            </select>
          </label>
        </div>
      </div>

      <div className="chart-grid">
        <section className="card">
          <h3>Average score per subject</h3>
          <BarChart data={bySubject} />
        </section>

        <section className="card">
          <h3>Progress over time</h3>
          <LineChart data={timeline} color={accent} />
        </section>
      </div>

      <div className="quick-actions">
        <button type="button" className="btn primary" onClick={() => setCheckInOpen(true)}>
          ⚡ Quick Check-In
        </button>
        {streak > 0 && (
          <span className="streak-pill" title="Daily check-in streak">
            🔥 {streak}-day streak
          </span>
        )}
        <Link to="/add-score" className="btn">
          ➕ Add a score
        </Link>
        <Link to="/goals" className="btn">
          🏆 View goals
        </Link>
        <button type="button" className="btn" onClick={() => setCelebrationOpen(true)}>
          🎉 Monthly Celebration
        </button>
      </div>

      <Widgets />

      {checkInOpen && <QuickCheckIn onClose={() => setCheckInOpen(false)} />}
      {celebrationOpen && <FamilyCelebration onClose={() => setCelebrationOpen(false)} />}
    </div>
  )
}
