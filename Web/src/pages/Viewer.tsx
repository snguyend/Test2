import { useMemo, useState } from 'react'
import { useAppData } from '../store-context'
import type { Student } from '../types'
import { academicScore, growthScore, habitScore } from '../utils/growth'
import { allBadgesOf, computeBadgeGroups } from '../utils/badges'

function firstName(name: string): string {
  return name.split(' ').slice(-1)[0]
}

function todayIso(): string {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export default function Viewer() {
  const {
    students,
    scores,
    goals,
    habitGoals,
    growthHistory,
    encouragements,
    photos,
    addEncouragement,
    deleteEncouragement,
  } = useAppData()

  const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Show the child's uploaded photo when available, else the emoji avatar.
  const renderAvatar = (s: Student, className: string) => {
    const photo = photos[s.id]
    return (
      <span className={className} style={{ background: photo ? '#fff' : s.color }}>
        {photo ? <img src={photo} alt={s.name} /> : s.avatar}
      </span>
    )
  }

  /* ---------- Family Summary ---------- */
  const summary = useMemo(() => {
    const perChild = students.map((s) => {
      const own = scores.filter((x) => x.studentId === s.id)
      const habits = habitGoals.filter((h) => h.studentId === s.id)
      const ownGoals = goals.filter((g) => g.studentId === s.id)
      const snaps = growthHistory
        .filter((g) => g.studentId === s.id)
        .sort((a, b) => a.date.localeCompare(b.date))
      const to = snaps.length ? Math.round(snaps[snaps.length - 1].score * 10) / 10 : 0
      const from = snaps.length ? Math.round(snaps[Math.max(0, snaps.length - 5)].score * 10) / 10 : 0
      const done = ownGoals.filter((g) => g.done).length
      const habitPct = habits.length
        ? Math.round(
            habits.reduce(
              (sum, h) =>
                sum + (h.weeklyTarget > 0 ? Math.min(100, (h.weeklyProgress / h.weeklyTarget) * 100) : 0),
              0,
            ) / habits.length,
          )
        : 0
      const growth = growthScore(academicScore(own), habitScore(habits))
      return { student: s, from, to, done, total: ownGoals.length, habitPct, growth }
    })
    const totalGoals = goals.length
    const doneGoals = goals.filter((g) => g.done).length
    const familyPct = totalGoals ? Math.round((doneGoals / totalGoals) * 100) : 0
    return { perChild, familyPct, doneGoals, totalGoals }
  }, [students, scores, goals, habitGoals, growthHistory])

  /* ---------- Achievements ---------- */
  const achievements = useMemo(
    () =>
      students.map((s) => {
        const own = scores.filter((x) => x.studentId === s.id)
        const habits = habitGoals.filter((h) => h.studentId === s.id)
        const ownGoals = goals.filter((g) => g.studentId === s.id)
        const earned = allBadgesOf(computeBadgeGroups(own, habits, ownGoals)).filter((b) => b.earned)
        return { student: s, earned }
      }),
    [students, scores, goals, habitGoals],
  )
  const totalBadges = achievements.reduce((n, a) => n + a.earned.length, 0)

  /* ---------- Encouragement Wall ---------- */
  const wall = useMemo(
    () =>
      [...encouragements]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((e) => ({ ...e, student: students.find((s) => s.id === e.studentId) })),
    [encouragements, students],
  )

  /* ---------- Send Encouragement form ---------- */
  const [studentId, setStudentId] = useState(students[0]?.id ?? '')
  const [from, setFrom] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const target = studentId || students[0]?.id
    const text = message.trim()
    if (!target || !text) return
    addEncouragement({
      studentId: target,
      from: from.trim() || 'Family',
      message: text,
      date: todayIso(),
    })
    setMessage('')
    setSent(true)
    setTimeout(() => setSent(false), 2500)
  }

  return (
    <div className="page viewer-page">
      <h1>👀 Family Viewer</h1>
      <p className="muted">A shareable snapshot of how the family is growing — {month}.</p>

      {/* 1. Family Summary */}
      <section className="card viewer-summary">
        <h2 className="viewer-section-title">📋 Family Summary</h2>
        <div className="viewer-summary-hero">
          <div className="viewer-summary-ring" aria-hidden>
            <span className="viewer-summary-pct">{summary.familyPct}%</span>
          </div>
          <p className="viewer-summary-headline">
            The family completed <strong>{summary.doneGoals}</strong> of{' '}
            <strong>{summary.totalGoals}</strong> goals this month.
          </p>
        </div>
        {students.length === 0 ? (
          <p className="muted">Add a child to see the family summary.</p>
        ) : (
          <ul className="viewer-summary-list">
            {summary.perChild.map((c) => {
              const growthText =
                c.to > c.from
                  ? `improved from ${c.from} to ${c.to}`
                  : c.to < c.from
                    ? `held at ${c.to}`
                    : `steady at ${c.to}`
              return (
                <li key={c.student.id} className="viewer-summary-item">
                  {renderAvatar(c.student, 'viewer-child-avatar')}
                  <span className="viewer-summary-text">
                    <strong>{firstName(c.student.name)}</strong> {growthText} on growth,{' '}
                    completed <strong>{c.done}</strong>/{c.total} goals
                    {c.habitPct ? `, habits at ${c.habitPct}%` : ''}.
                  </span>
                  <span className="viewer-growth-chip">{c.growth.toFixed(1)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* 2. Achievements */}
      <section className="card viewer-achievements">
        <h2 className="viewer-section-title">
          🏅 Achievements
          <span className="viewer-count">{totalBadges} earned</span>
        </h2>
        {students.length === 0 ? (
          <p className="muted">No achievements yet.</p>
        ) : (
          <div className="viewer-ach-grid">
            {achievements.map(({ student, earned }) => (
              <div
                key={student.id}
                className="viewer-ach-child"
                style={{ borderTopColor: student.color }}
              >
                <div className="viewer-ach-head">
                  {renderAvatar(student, 'viewer-child-avatar')}
                  <strong>{student.name}</strong>
                </div>
                {earned.length === 0 ? (
                  <p className="muted viewer-ach-empty">New badges are within reach! 💪</p>
                ) : (
                  <div className="viewer-badges">
                    {earned.map((b) => (
                      <span key={b.name} className="viewer-badge" title={b.desc}>
                        <span className="viewer-badge-icon">{b.icon}</span>
                        {b.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Encouragement Wall */}
      <section className="card viewer-wall">
        <h2 className="viewer-section-title">
          💌 Encouragement Wall
          <span className="viewer-count">{wall.length}</span>
        </h2>
        {wall.length === 0 ? (
          <p className="muted">No notes yet — be the first to cheer someone on below! 🎉</p>
        ) : (
          <div className="viewer-wall-grid">
            {wall.map((e) => (
              <div key={e.id} className="viewer-note">
                <button
                  className="viewer-note-delete"
                  onClick={() => deleteEncouragement(e.id)}
                  aria-label="Remove note"
                  title="Remove"
                >
                  ✕
                </button>
                <p className="viewer-note-msg">“{e.message}”</p>
                <div className="viewer-note-foot">
                  <span className="viewer-note-for">
                    {e.student ? (
                      <>
                        {renderAvatar(e.student, 'viewer-note-avatar')}
                        {firstName(e.student.name)}
                      </>
                    ) : (
                      'Family'
                    )}
                  </span>
                  <span className="viewer-note-from">— {e.from}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Send Encouragement */}
      <section className="card viewer-send">
        <h2 className="viewer-section-title">✍️ Send Encouragement</h2>
        {students.length === 0 ? (
          <p className="muted">Add a child first to send an encouragement.</p>
        ) : (
          <form className="viewer-send-form" onSubmit={send}>
            <div className="viewer-send-row">
              <label className="viewer-field">
                <span>To</span>
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.avatar} {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="viewer-field">
                <span>From</span>
                <input
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="e.g. Mom, Grandma"
                />
              </label>
            </div>
            <label className="viewer-field">
              <span>Message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write something kind and motivating…"
                rows={3}
                maxLength={240}
              />
            </label>
            <div className="viewer-send-actions">
              {sent && <span className="viewer-sent-msg">Sent! 💛</span>}
              <button type="submit" className="btn primary" disabled={!message.trim()}>
                💌 Send encouragement
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
