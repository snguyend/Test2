import { useEffect, useState } from 'react'
import { useAppData } from '../store-context'

interface GoalManagerProps {
  onClose: () => void
}

export default function GoalManager({ onClose }: GoalManagerProps) {
  const { students, goals, rewards, addGoal, updateGoal, deleteGoal, toggleGoal } = useAppData()

  const [studentId, setStudentId] = useState(students[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [points, setPoints] = useState('20')
  const [subject, setSubject] = useState('')
  const [rewardId, setRewardId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please enter a goal title.')
      return
    }
    addGoal({
      studentId,
      title: title.trim(),
      points: Number(points) || 0,
      subject: subject.trim() || undefined,
      rewardId,
      done: false,
    })
    setTitle('')
    setPoints('20')
    setSubject('')
    setRewardId('')
    setError('')
  }

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? 'Unknown'
  const studentAvatar = (id: string) => students.find((s) => s.id === id)?.avatar ?? '👤'

  return (
    <div className="goal-modal-backdrop" onClick={onClose}>
      <div
        className="goal-modal card"
        role="dialog"
        aria-modal="true"
        aria-label="Manage family goals"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="goal-modal-head">
          <h2>🎯 Manage Family Goals</h2>
          <button className="goal-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Add new goal */}
        <form className="goal-add-form" onSubmit={submit}>
          <div className="goal-add-row">
            <label>
              Child
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.avatar} {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="goal-add-title">
              Goal
              <input
                type="text"
                value={title}
                placeholder="e.g. Score 9+ in Math"
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
          </div>
          <div className="goal-add-row">
            <label>
              Subject (optional)
              <input
                type="text"
                value={subject}
                placeholder="e.g. Math"
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
            <label>
              Points
              <input
                type="number"
                min={0}
                step={5}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </label>
            <label>
              Reward (optional)
              <select value={rewardId} onChange={(e) => setRewardId(e.target.value)}>
                <option value="">None</option>
                {rewards.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.icon} {r.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn primary goal-add-btn">
            ➕ Add goal
          </button>
        </form>

        {/* Existing goals */}
        <div className="goal-list">
          <h3>All goals ({goals.length})</h3>
          {goals.length === 0 ? (
            <p className="muted">No goals yet. Add one above.</p>
          ) : (
            <ul>
              {goals.map((g) => (
                <li key={g.id} className={g.done ? 'goal-edit-row done' : 'goal-edit-row'}>
                  <button
                    className="goal-edit-check"
                    onClick={() => toggleGoal(g.id)}
                    aria-label={g.done ? 'Mark not done' : 'Mark done'}
                    title={g.done ? 'Mark not done' : 'Mark done'}
                  >
                    {g.done ? '✅' : '⬜'}
                  </button>
                  <span className="goal-edit-avatar" title={studentName(g.studentId)}>
                    {studentAvatar(g.studentId)}
                  </span>
                  <input
                    className="goal-edit-title"
                    value={g.title}
                    onChange={(e) => updateGoal(g.id, { title: e.target.value })}
                    aria-label="Goal title"
                  />
                  <input
                    className="goal-edit-points"
                    type="number"
                    min={0}
                    step={5}
                    value={g.points}
                    onChange={(e) => updateGoal(g.id, { points: Number(e.target.value) || 0 })}
                    aria-label="Points"
                    title="Points"
                  />
                  <button
                    className="row-delete"
                    onClick={() => deleteGoal(g.id)}
                    aria-label={`Delete ${g.title}`}
                    title="Delete goal"
                  >
                    🗑
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
