import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAppData } from '../store-context'

const AVATARS = ['🧒', '👦', '👧', '🧑', '👶', '🐨', '🦊', '🐼', '🦁', '🦄']
const COLORS = ['#2563eb', '#db2777', '#16a34a', '#f97316', '#7c3aed', '#0891b2']

/** Sidebar "Children" list with inline add / delete controls. */
export default function ChildrenManager() {
  const { students, addStudent, deleteStudent } = useAppData()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [color, setColor] = useState(COLORS[0])

  const reset = () => {
    setName('')
    setGrade('')
    setAvatar(AVATARS[0])
    setColor(COLORS[0])
    setAdding(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    addStudent({ name: trimmed, grade: grade.trim(), avatar, color })
    reset()
  }

  const remove = (id: string, childName: string) => {
    if (window.confirm(`Remove ${childName}? This also deletes their scores, goals and habits.`)) {
      deleteStudent(id)
    }
  }

  return (
    <div className="children-manager">
      <ul className="side-list">
        {students.map((s) => (
          <li key={s.id} className="child-row">
            <NavLink
              to={`/students/${s.id}`}
              className={({ isActive }) =>
                isActive ? 'side-link child-link active' : 'side-link child-link'
              }
              style={{ ['--c' as string]: s.color } as React.CSSProperties}
            >
              <span className="child-avatar">{s.avatar}</span>
              {s.name}
            </NavLink>
            <button
              type="button"
              className="child-delete"
              onClick={() => remove(s.id, s.name)}
              aria-label={`Remove ${s.name}`}
              title={`Remove ${s.name}`}
            >
              🗑
            </button>
          </li>
        ))}
      </ul>

      {adding ? (
        <form className="child-add-form" onSubmit={submit}>
          <input
            className="child-add-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Child's name"
            aria-label="Child's name"
            autoFocus
          />
          <input
            className="child-add-input"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="Grade (e.g. Grade 3)"
            aria-label="Grade"
          />
          <div className="child-add-row">
            <div className="child-emoji-picker" role="group" aria-label="Choose an avatar">
              {AVATARS.map((a) => (
                <button
                  type="button"
                  key={a}
                  className={a === avatar ? 'child-emoji active' : 'child-emoji'}
                  onClick={() => setAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="child-add-row">
            <div className="child-color-picker" role="group" aria-label="Choose a color">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={c === color ? 'child-color active' : 'child-color'}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="child-add-actions">
            <button type="submit" className="btn primary child-add-save">
              Add
            </button>
            <button type="button" className="btn child-add-cancel" onClick={reset}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="child-add-toggle" onClick={() => setAdding(true)}>
          ＋ Add child
        </button>
      )}
    </div>
  )
}
