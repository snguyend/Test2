import { Link, useParams } from 'react-router-dom'
import { useAppData } from '../store-context'
import Avatar from '../components/Avatar'
import BarChart from '../components/BarChart'
import { averageScore, semesterAverage, subjectAverages } from '../utils/scores'

export default function StudentDetails() {
  const { students, scores, goals, setSubjectAverage, deleteScore } = useAppData()
  const { id } = useParams()

  // Student picker list when no id is selected
  if (!id) {
    return (
      <div className="page">
        <h1>Students</h1>
        <p className="muted">Pick a student to see their details.</p>
        <div className="card-grid">
          {students.map((student) => (
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
              <Link to={`/students/${student.id}`} className="card-link">
                Open →
              </Link>
            </div>
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
        <Avatar student={student} size={64} editable />
        <div>
          <h1>{student.name}</h1>
          <span className="muted">{student.grade}</span>
          <span className="photo-hint">📷 Click the photo to change it</span>
        </div>
      </div>

      <div className="stat-row card">
        <div className="stat">
          <span className="stat-value">{averageScore(studentScores)}</span>
          <span className="stat-label">Overall avg</span>
        </div>
        <div className="stat">
          <span className="stat-value">{semesterAverage(studentScores, 'first')}</span>
          <span className="stat-label">1st semester</span>
        </div>
        <div className="stat">
          <span className="stat-value">{semesterAverage(studentScores, 'second')}</span>
          <span className="stat-label">2nd semester</span>
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
        <BarChart data={subjectAverages(studentScores)} />

        {subjectAverages(studentScores).length > 0 && (
          <div className="subject-adjusters">
            <p className="muted adjuster-hint">
              Drag to adjust a subject's average (0–10) — recent scores update live.
            </p>
            {subjectAverages(studentScores).map(({ label, value }) => (
              <label key={label} className="adjuster">
                <span className="adjuster-label">{label}</span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={Math.min(10, Math.round(value))}
                  onChange={(e) => setSubjectAverage(student.id, label, Number(e.target.value))}
                  style={{ accentColor: student.color }}
                  aria-label={`Adjust ${label} average`}
                />
                <span className="adjuster-value">{Math.min(10, Math.round(value))}/10</span>
              </label>
            ))}
          </div>
        )}
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
                <span className="muted">
                  {s.date} · {s.semester === 'first' ? '1st' : '2nd'} sem
                </span>
                <span className="badge">{s.score}</span>
                <button
                  className="row-delete"
                  onClick={() => deleteScore(s.id)}
                  aria-label={`Delete ${s.subject} score`}
                  title="Delete score"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="quick-actions">
        <Link to="/add-score" className="btn primary">
          ➕ Add score for {student.name}
        </Link>
        {studentScores.length > 0 && (
          <button
            className="btn danger"
            onClick={() => deleteScore(recent[0].id)}
            title="Delete the most recent score"
          >
            🗑 Delete latest score
          </button>
        )}
      </div>
    </div>
  )
}
