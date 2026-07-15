import { useEffect, useState } from 'react'
import { useAppData } from '../store-context'
import { currentStreak, todayIso } from '../utils/streak'

interface QuickCheckInProps {
  onClose: () => void
  studentId?: string // when set, only show this student's habits
}

/**
 * Fast daily habit check-in. Enter today's amount for each habit and Save;
 * the values are added to each habit's weekly progress, which flows through
 * to the weekly goal and the growth score automatically.
 */
export default function QuickCheckIn({ onClose, studentId }: QuickCheckInProps) {
  const { students, habitGoals, checkIns, updateHabitGoal, recordCheckIn } = useAppData()
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const scopedHabits = studentId
    ? habitGoals.filter((h) => h.studentId === studentId)
    : habitGoals

  const groups = students
    .filter((s) => !studentId || s.id === studentId)
    .map((s) => ({ student: s, habits: habitGoals.filter((h) => h.studentId === s.id) }))
    .filter((g) => g.habits.length > 0)

  const enteredCount = scopedHabits.reduce(
    (n, h) => n + (Number(amounts[h.id]) > 0 ? 1 : 0),
    0,
  )

  // Streak after saving today's check-in (dedupe today's date).
  const streakAfterSave = currentStreak(
    checkIns.includes(todayIso()) ? checkIns : [...checkIns, todayIso()],
  )

  const save = () => {
    scopedHabits.forEach((h) => {
      const add = Number(amounts[h.id])
      if (add > 0) updateHabitGoal(h.id, { weeklyProgress: h.weeklyProgress + add })
    })
    recordCheckIn()
    setSaved(true)
  }

  return (
    <div className="goal-modal-backdrop" onClick={onClose}>
      <div
        className="goal-modal card"
        role="dialog"
        aria-modal="true"
        aria-label="Quick habit check-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="goal-modal-head">
          <h2>⚡ Quick Check-In</h2>
          <button className="goal-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {saved ? (
          <div className="checkin-success">
            <span className="checkin-success-icon">🎉</span>
            <h3>Check-in saved!</h3>
            <div className="checkin-streak">🔥 {streakAfterSave}-day streak</div>
            <ul>
              <li>✅ Habit progress updated</li>
              <li>✅ Weekly goal updated</li>
              <li>✅ Growth engine updated</li>
            </ul>
            <button className="btn primary" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="muted">Log today's progress in 30 seconds ⏱️</p>

            {groups.length === 0 ? (
              <p className="muted">No habits yet. Add habit goals on a student's Goals tab first.</p>
            ) : (
              <div className="checkin-groups">
                {groups.map(({ student, habits }) => (
                  <div key={student.id} className="checkin-group">
                    <div className="checkin-student">
                      <span className="checkin-avatar" style={{ background: student.color }}>
                        {student.avatar}
                      </span>
                      {student.name}
                    </div>
                    {habits.map((h) => (
                      <label key={h.id} className="checkin-row">
                        <span className="checkin-habit">
                          <span className="checkin-icon">{h.icon}</span> {h.activity}
                        </span>
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          placeholder="0"
                          value={amounts[h.id] ?? ''}
                          onChange={(e) =>
                            setAmounts((prev) => ({ ...prev, [h.id]: e.target.value }))
                          }
                          aria-label={`Today's ${h.activity} for ${student.name}`}
                        />
                        <span className="checkin-unit">{h.unit}</span>
                        <span className="checkin-current muted">
                          now {h.weeklyProgress}/{h.weeklyTarget}
                        </span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="btn primary checkin-save"
              onClick={save}
              disabled={enteredCount === 0}
            >
              💾 Save check-in{enteredCount > 0 ? ` (${enteredCount})` : ''}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
