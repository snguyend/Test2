import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useAppData } from '../store-context'

/** Format an ISO date (YYYY-MM-DD) as a short, friendly label. */
function formatDue(iso?: string): string {
  if (!iso) return 'No due date'
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

/** True when a due date is in the past (and the task isn't done). */
function isOverdue(iso?: string): boolean {
  if (!iso) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(`${iso}T00:00:00`) < today
}

export default function Homework() {
  const { students, homework, addHomework, toggleHomework, deleteHomework } = useAppData()

  const [studentId, setStudentId] = useState(students[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')

  // Guard against a stale selection (e.g. a child was removed).
  const activeStudentId = students.some((s) => s.id === studentId)
    ? studentId
    : students[0]?.id ?? ''
  const activeStudent = students.find((s) => s.id === activeStudentId)

  const list = useMemo(
    () =>
      homework
        .filter((h) => h.studentId === activeStudentId)
        .slice()
        .sort((a, b) => {
          // Not-done first, then by due date ascending.
          if (a.done !== b.done) return a.done ? 1 : -1
          return (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
        }),
    [homework, activeStudentId],
  )

  const doneCount = list.filter((h) => h.done).length

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !activeStudentId) return
    addHomework({
      studentId: activeStudentId,
      title: title.trim(),
      subject: subject.trim() || undefined,
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      done: false,
    })
    setTitle('')
    setSubject('')
    setDueDate('')
    setDescription('')
  }

  if (students.length === 0) {
    return (
      <div className="page">
        <h1>Homework</h1>
        <p className="muted">Add a child first to start assigning homework.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <section style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 6 }}>📝 Homework</h1>
        <p className="muted" style={{ margin: 0 }}>
          Assign tasks, set due dates, and track what&apos;s done — shared with the whole family.
        </p>
      </section>

      {/* Child selector */}
      <div
        className="card"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 18 }}
      >
        <span style={{ fontWeight: 600 }}>Child</span>
        {students.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStudentId(s.id)}
            className="course-cat"
            style={
              s.id === activeStudentId
                ? { background: s.color, color: '#fff', borderColor: s.color }
                : undefined
            }
          >
            {s.avatar} {s.name}
          </button>
        ))}
      </div>

      {/* Assign new homework */}
      <form onSubmit={submit} className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>➕ Assign new homework</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span className="muted" style={{ fontSize: 13 }}>Title *</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Math worksheet p.10"
              required
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span className="muted" style={{ fontSize: 13 }}>Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Math"
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span className="muted" style={{ fontSize: 13 }}>Due date</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>
        <label style={{ display: 'grid', gap: 4, marginTop: 12 }}>
          <span className="muted" style={{ fontSize: 13 }}>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What should they do?"
            rows={2}
            style={{ resize: 'vertical' }}
          />
        </label>
        <div style={{ marginTop: 12 }}>
          <button type="submit" className="btn">
            Assign to {activeStudent?.name ?? 'child'}
          </button>
        </div>
      </form>

      {/* Assigned list */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>📚 Assigned homework</h3>
          <span className="muted" style={{ fontSize: 13 }}>
            {doneCount}/{list.length} done
          </span>
        </div>

        {list.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No homework yet. Assign the first task above.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
            {list.map((h) => {
              const overdue = !h.done && isOverdue(h.dueDate)
              return (
                <li
                  key={h.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border, #e5e7eb)',
                    background: h.done ? 'color-mix(in srgb, #22c55e 8%, #ffffff)' : '#fff',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={h.done}
                    onChange={() => toggleHomework(h.id)}
                    aria-label={h.done ? 'Mark as not done' : 'Mark as done'}
                    style={{ marginTop: 4, width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                      <strong style={{ textDecoration: h.done ? 'line-through' : 'none' }}>
                        {h.title}
                      </strong>
                      {h.subject && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#6366f1',
                            background: 'color-mix(in srgb, #6366f1 12%, #fff)',
                            borderRadius: 999,
                            padding: '2px 9px',
                          }}
                        >
                          {h.subject}
                        </span>
                      )}
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 12,
                          fontWeight: 600,
                          color: overdue ? '#e11d48' : 'var(--muted, #6b7280)',
                        }}
                      >
                        {overdue ? '⏰ ' : '📅 '}
                        {formatDue(h.dueDate)}
                      </span>
                    </div>
                    {h.description && (
                      <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>
                        {h.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteHomework(h.id)}
                    title="Delete"
                    aria-label={`Delete ${h.title}`}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                  >
                    🗑
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
