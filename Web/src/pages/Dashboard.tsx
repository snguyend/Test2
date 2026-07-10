import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../store-context'
import Avatar from '../components/Avatar'
import BarChart from '../components/BarChart'
import LineChart from '../components/LineChart'
import Particles from '../components/Particles'
import { averageScore, subjectAverages } from '../utils/scores'

export default function Dashboard() {
  const { students, scores, goals } = useAppData()
  const [filter, setFilter] = useState<string>('all')
  const [semester, setSemester] = useState<'all' | 'first' | 'second'>('all')

  const activeStudent = students.find((s) => s.id === filter)
  const accent = activeStudent?.color

  const filteredScores = useMemo(
    () =>
      scores.filter(
        (s) =>
          (filter === 'all' || s.studentId === filter) &&
          (semester === 'all' || s.semester === semester),
      ),
    [scores, filter, semester],
  )

  const bySubject = useMemo(() => subjectAverages(filteredScores), [filteredScores])

  const timeline = useMemo(
    () =>
      [...filteredScores]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((s) => ({ label: s.date.slice(5), value: s.score })),
    [filteredScores],
  )

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

      <div className="card-grid">
        {students.map((student) => {
          const studentScores = scores.filter((s) => s.studentId === student.id)
          const studentGoals = goals.filter((g) => g.studentId === student.id)
          const doneGoals = studentGoals.filter((g) => g.done).length

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
              <div className="stat-row">
                <div className="stat">
                  <span className="stat-value">{averageScore(studentScores)}</span>
                  <span className="stat-label">Avg score</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{studentScores.length}</span>
                  <span className="stat-label">Records</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {doneGoals}/{studentGoals.length}
                  </span>
                  <span className="stat-label">Goals</span>
                </div>
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
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">👨‍👩‍👧‍👦 All students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.avatar} {s.name}
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
        <Link to="/add-score" className="btn primary">
          ➕ Add a score
        </Link>
        <Link to="/goals" className="btn">
          🏆 View goals
        </Link>
      </div>
    </div>
  )
}
