import { useState } from 'react'
import { useAppData } from '../store-context'
import BarChart from '../components/BarChart'
import { subjectAverages } from '../utils/scores'

export default function ProgressCharts() {
  const { students, scores } = useAppData()
  const [studentId, setStudentId] = useState(students[0]?.id ?? '')

  const studentScores = scores.filter((s) => s.studentId === studentId)
  const timeline = [...studentScores].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="page">
      <h1>Progress Charts</h1>
      <p className="muted">See how scores are trending over time.</p>

      <div className="tabs">
        {students.map((s) => (
          <button
            key={s.id}
            className={s.id === studentId ? 'tab active' : 'tab'}
            onClick={() => setStudentId(s.id)}
          >
            {s.avatar} {s.name}
          </button>
        ))}
      </div>

      <section className="card">
        <h2>Average by subject</h2>
        <BarChart data={subjectAverages(studentScores)} />
      </section>

      <section className="card">
        <h2>Score timeline</h2>
        <BarChart
          data={timeline.map((s) => ({ label: `${s.subject} · ${s.date.slice(5)}`, value: s.score }))}
        />
      </section>
    </div>
  )
}
