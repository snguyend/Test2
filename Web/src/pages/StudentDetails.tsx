import { Link, useParams } from 'react-router-dom'
import { useAppData } from '../store'
import BarChart from '../components/BarChart'
import { averageScore, subjectAverages } from '../utils/scores'

export default function StudentDetails() {
  const { students, scores, goals } = useAppData()
  const { id } = useParams()

  // Student picker list when no id is selected
  if (!id) {
    return (
      <div className="page">
        <h1>Students</h1>
        <p className="muted">Pick a student to see their details.</p>
        <div className="card-grid">
          {students.map((student) => (
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
            </Link>
          ))}
        </div>
      </div>
    )
  }

  const student = students.find((s) => s.id === id)
  if (!student) {
    return (
      <div className="page">
        <h1>Not found</h1>
        <p className="muted">We couldn't find that student.</p>
        <Link to="/students" className="btn">
          Back to students
        </Link>
      </div>
    )
  }

  const studentScores = scores.filter((s) => s.studentId === student.id)
  const studentGoals = goals.filter((g) => g.studentId === student.id)
  const recent = [...studentScores].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  return (
    <div className="page">
      <div className="student-head big">
        <span className="avatar" style={{ background: student.color }}>
          {student.avatar}
        </span>
        <div>
          <h1>{student.name}</h1>
          <span className="muted">{student.grade}</span>
        </div>
      </div>

      <div className="stat-row card">
        <div className="stat">
          <span className="stat-value">{averageScore(studentScores)}</span>
          <span className="stat-label">Avg score</span>
        </div>
        <div className="stat">
          <span className="stat-value">{studentScores.length}</span>
          <span className="stat-label">Records</span>
        </div>
        <div className="stat">
          <span className="stat-value">{studentGoals.filter((g) => g.done).length}</span>
          <span className="stat-label">Goals done</span>
        </div>
      </div>

      <section className="card">
        <h2>Average by subject</h2>
        <BarChart data={subjectAverages(studentScores)} color={student.color} />
      </section>

      <section className="card">
        <h2>Recent scores</h2>
        {recent.length === 0 ? (
          <p className="muted">No scores yet.</p>
        ) : (
          <ul className="list">
            {recent.map((s) => (
              <li key={s.id} className="list-row">
                <span>{s.subject}</span>
                <span className="muted">{s.date}</span>
                <span className="badge">{s.score}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link to="/add-score" className="btn primary">
        ➕ Add score for {student.name}
      </Link>
    </div>
  )
}
