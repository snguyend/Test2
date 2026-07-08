import { Link } from 'react-router-dom'
import { useAppData } from '../store'
import { averageScore } from '../utils/scores'

export default function Dashboard() {
  const { students, scores, goals } = useAppData()

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-text">
          <h1>Welcome back 👋</h1>
          <p>Track your children's learning journey, celebrate wins, and set new goals.</p>
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
            <Link key={student.id} to={`/students/${student.id}`} className="card student-card">
              <div className="student-head">
                <span className="avatar" style={{ background: student.color }}>
                  {student.avatar}
                </span>
                <div>
                  <h2>{student.name}</h2>
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
            </Link>
          )
        })}
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
