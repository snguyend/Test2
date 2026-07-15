import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../store-context'
import type { ScoreEntry } from '../types'
import { currentGrade, gradeOptionsFor } from '../utils/grades'

export default function AddScore() {
  const { students, addScore } = useAppData()
  const navigate = useNavigate()

  const [studentId, setStudentId] = useState(students[0]?.id ?? '')
  const [subject, setSubject] = useState('')
  const [score, setScore] = useState('')
  const [semester, setSemester] = useState<ScoreEntry['semester']>('second')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')

  const selectedStudent = students.find((s) => s.id === studentId)
  const gradeOptions = gradeOptionsFor(studentId)
  const [grade, setGrade] = useState<number>(() =>
    selectedStudent ? currentGrade(selectedStudent) : gradeOptions[0],
  )

  // When the student changes, default the grade to their current grade.
  const handleStudentChange = (nextId: string) => {
    setStudentId(nextId)
    const next = students.find((s) => s.id === nextId)
    setGrade(next ? currentGrade(next) : gradeOptionsFor(nextId)[0])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numericScore = Number(score)

    if (!subject.trim()) {
      setError('Please enter a subject.')
      return
    }
    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
      setError('Score must be a number between 0 and 10.')
      return
    }

    addScore({ studentId, subject: subject.trim(), score: numericScore, date, semester, grade })
    navigate(`/students/${studentId}`)
  }

  return (
    <div className="page">
      <h1>Add Score</h1>
      <p className="muted">Record a new test or quiz result.</p>

      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Student
          <select value={studentId} onChange={(e) => handleStudentChange(e.target.value)}>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.avatar} {s.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Grade
          <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
        </label>

        <label>
          Subject
          <input
            type="text"
            value={subject}
            placeholder="e.g. Math"
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>

        <label>
          Score (0-10)
          <input
            type="number"
            value={score}
            min={0}
            max={10}
            step={1}
            placeholder="e.g. 9"
            onChange={(e) => setScore(e.target.value)}
          />
        </label>

        <label>
          Semester
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value as ScoreEntry['semester'])}
          >
            <option value="first">First semester</option>
            <option value="second">Second semester</option>
          </select>
        </label>

        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="btn primary">
          Save score
        </button>
      </form>
    </div>
  )
}
