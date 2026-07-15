import { useEffect, useState } from 'react'
import { STORAGE_KEYS, loadState, saveState } from '../utils/storage'

const CLOCKS = [
  { city: 'Bangkok', tz: 'Asia/Bangkok' },
  { city: 'Berlin', tz: 'Europe/Berlin' },
  { city: 'Sydney', tz: 'Australia/Sydney' },
  { city: 'New York', tz: 'America/New_York' },
]

const TIPS = [
  'Study in short 25-minute bursts, then take a 5-minute break.',
  'Teach what you learned to someone else — it locks it in.',
  "Review yesterday's notes for 5 minutes before starting.",
  'Do the hardest subject first while your energy is highest.',
  'Drink water and sit up straight — focus follows posture.',
  'Sleep well before a test — rest beats late-night cramming.',
  'Celebrate small wins to stay motivated. 🎉',
]

const FOCUS_MINUTES = 25

interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

/* ---------- Focus timer ---------- */
function FocusTimer() {
  const total = FOCUS_MINUTES * 60
  const [secondsLeft, setSecondsLeft] = useState(total)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const progress = ((total - secondsLeft) / total) * 360
  const ringStyle = {
    background: `conic-gradient(#f97316 ${progress}deg, color-mix(in srgb, var(--text) 12%, transparent) 0deg)`,
  }

  return (
    <div className="widget widget-focus card">
      <h3 className="widget-title">⏱️ Focus Timer</h3>
      <div className="focus-ring" style={ringStyle}>
        <button
          className="focus-btn"
          onClick={() => setRunning((r) => !r)}
          aria-label={running ? 'Pause timer' : 'Start timer'}
        >
          {running ? '⏸' : '▶'}
        </button>
      </div>
      <div className="focus-time">
        {pad(mins)}:{pad(secs)}
      </div>
      <div className="focus-label muted">Focus</div>
      <button
        className="focus-reset"
        onClick={() => {
          setRunning(false)
          setSecondsLeft(total)
        }}
        aria-label="Reset timer"
        title="Reset"
      >
        ↺
      </button>
    </div>
  )
}

/* ---------- World clock ---------- */
function WorldClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const format = (tz: string) => {
    const time = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: tz,
    }).format(now)
    const zone =
      new Intl.DateTimeFormat('en-US', { timeZoneName: 'short', timeZone: tz })
        .formatToParts(now)
        .find((p) => p.type === 'timeZoneName')?.value ?? ''
    return { time, zone }
  }

  return (
    <div className="widget widget-clock card">
      <h3 className="widget-title">🌍 World Clock</h3>
      <ul className="clock-list">
        {CLOCKS.map((c) => {
          const { time, zone } = format(c.tz)
          return (
            <li key={c.city} className="clock-row">
              <div className="clock-city">
                <span>{c.city}</span>
                <span className="muted clock-zone">{zone}</span>
              </div>
              <span className="clock-time">{time}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ---------- Checklist ---------- */
function Checklist() {
  const [items, setItems] = useState<ChecklistItem[]>(() =>
    loadState<ChecklistItem[]>(STORAGE_KEYS.checklist, []),
  )
  const [text, setText] = useState('')

  useEffect(() => saveState(STORAGE_KEYS.checklist, items), [items])

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    setItems((prev) => [...prev, { id: `c${Date.now()}`, text: value, done: false }])
    setText('')
  }

  const toggle = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))

  const doneCount = items.filter((i) => i.done).length

  return (
    <div className="widget widget-checklist card">
      <h3 className="widget-title">
        ✅ Checklist
        {items.length > 0 && (
          <span className="checklist-progress">
            {doneCount} of {items.length} done
          </span>
        )}
      </h3>
      <form className="checklist-add" onSubmit={add}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task…"
          aria-label="New task"
        />
        <button type="submit" className="btn primary checklist-add-btn" aria-label="Add item">
          ＋
        </button>
      </form>
      {items.length === 0 ? (
        <p className="muted checklist-empty">No tasks yet. Add homework or study goals.</p>
      ) : (
        <ul className="checklist">
          {items.map((i) => (
            <li key={i.id} className={i.done ? 'checklist-item done' : 'checklist-item'}>
              <label>
                <input type="checkbox" checked={i.done} onChange={() => toggle(i.id)} />
                <span>{i.text}</span>
              </label>
              <button
                className="row-delete"
                onClick={() => remove(i.id)}
                aria-label={`Delete ${i.text}`}
                title="Delete"
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------- Study tip ---------- */
function StudyTip() {
  const [i, setI] = useState(() => Math.floor(Date.now() / 86_400_000) % TIPS.length)
  return (
    <div className="widget widget-tip card">
      <h3 className="widget-title">💡 Study Tip</h3>
      <p className="tip-text">{TIPS[i]}</p>
      <button className="btn tip-next" onClick={() => setI((p) => (p + 1) % TIPS.length)}>
        Another tip →
      </button>
    </div>
  )
}

/* ---------- Section wrapper ---------- */
export default function Widgets() {
  const [open, setOpen] = useState(true)
  return (
    <section className="widgets-section">
      <button
        className="widgets-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <h2>Widgets</h2>
        <span className="widgets-chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="widgets-grid">
          <FocusTimer />
          <WorldClock />
          <Checklist />
          <StudyTip />
        </div>
      )}
    </section>
  )
}
