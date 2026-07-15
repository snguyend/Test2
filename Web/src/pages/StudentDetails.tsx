import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppData } from '../store-context'
import Avatar from '../components/Avatar'
import BarChart from '../components/BarChart'
import LineChart from '../components/LineChart'
import SubjectLogo from '../components/SubjectLogo'
import QuickCheckIn from '../components/QuickCheckIn'
import { averageScore, semesterAverage, subjectAverages } from '../utils/scores'
import {
  academicScore as calcAcademic,
  habitScore as calcHabit,
  growthScore as calcGrowth,
  isoDay,
  weekMondays,
  dayLabel,
} from '../utils/growth'
import { currentStreak } from '../utils/streak'
import { currentGrade, gradeOptionsFor, schoolYearForGrade } from '../utils/grades'
import { subjectColor } from '../data/courses'

type StudentTab = 'progress' | 'goals' | 'achievements' | 'journal'

const TABS: { id: StudentTab; label: string; icon: string }[] = [
  { id: 'progress', label: 'Progress', icon: '📊' },
  { id: 'goals', label: 'Goals', icon: '🎯' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'journal', label: 'Growth Journal', icon: '📔' },
]

export default function StudentDetails() {
  const {
    students,
    scores,
    goals,
    habitGoals,
    journal,
    checkIns,
    growthHistory,
    schoolYearOverrides,
    setSubjectAverage,
    deleteScore,
    toggleGoal,
    addGoal,
    updateGoal,
    deleteGoal,
    addHabitGoal,
    updateHabitGoal,
    deleteHabitGoal,
    addJournalEntry,
    deleteJournalEntry,
    snapshotGrowth,
    setSchoolYear,
    resetSchoolYear,
  } = useAppData()
  const { id } = useParams()
  const student = id ? students.find((s) => s.id === id) : undefined
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [tab, setTab] = useState<StudentTab>('progress')
  const [wentWell, setWentWell] = useState('')
  const [toImprove, setToImprove] = useState('')
  const [nextGoals, setNextGoals] = useState('')
  const [reflection, setReflection] = useState('')
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [fromDate, setFromDate] = useState<string | null>(null)
  const [toDate, setToDate] = useState<string | null>(null)
  // School-year edit form
  const [editingYear, setEditingYear] = useState(false)
  const [yearStartInput, setYearStartInput] = useState('')
  const [yearEndInput, setYearEndInput] = useState('')

  // New academic goal form
  const [newAcadSubject, setNewAcadSubject] = useState('')
  const [newAcadTarget, setNewAcadTarget] = useState('8')
  // New habit goal form
  const [newHabitActivity, setNewHabitActivity] = useState('')
  const [newHabitIcon, setNewHabitIcon] = useState('🎯')
  const [newHabitUnit, setNewHabitUnit] = useState<string>('minutes')
  const [newHabitTarget, setNewHabitTarget] = useState('120')

  // Reset the grade tab / active tab whenever we switch to a different student.
  useEffect(() => {
    setSelectedGrade(null)
    setTab('progress')
    setFromDate(null)
    setToDate(null)
    setEditingYear(false)
  }, [id])

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

  const cur = currentGrade(student)
  const grade = selectedGrade ?? cur
  const gradeOptions = gradeOptionsFor(student.id)

  // School year for this grade (default Sep→May, or a saved override).
  const defaultYear = schoolYearForGrade(student, grade)
  const yearKey = `${student.id}:${grade}`
  const override = schoolYearOverrides[yearKey]
  const yearStart = override ? new Date(override.start) : defaultYear.start
  const yearEnd = override ? new Date(override.end) : defaultYear.end
  const schoolYear = {
    start: yearStart,
    end: yearEnd,
    label: `${yearStart.getFullYear()}–${yearEnd.getFullYear()}`,
    range: `${dayLabel(yearStart)} → ${dayLabel(yearEnd)}`,
  }

  const studentScores = scores.filter((s) => s.studentId === student.id)
  const gradeScores = studentScores.filter((s) => (s.grade ?? cur) === grade)
  const studentGoals = goals.filter((g) => g.studentId === student.id)
  const studentHabits = habitGoals.filter((h) => h.studentId === student.id)
  const studentJournal = journal.filter((j) => j.studentId === student.id)
  const recent = [...gradeScores].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const subjects = subjectAverages(gradeScores)

  const countForGrade = (g: number) =>
    studentScores.filter((s) => (s.grade ?? cur) === g).length

  // ---- Growth Score System (0–10 scale, Academic 70% + Habit 30%) ----
  const habitPct = (h: (typeof studentHabits)[number]) =>
    h.weeklyTarget > 0 ? Math.min(100, Math.round((h.weeklyProgress / h.weeklyTarget) * 100)) : 0
  const academic = calcAcademic(studentScores) // 0–10
  const habit = calcHabit(studentHabits) // 0–10
  const growth = calcGrowth(academic, habit) // 0–10

  // Weekly growth series across the selected grade's school year (date-based).
  // Each week shows a saved snapshot if present, otherwise a smooth trend.
  const mondays = weekMondays(schoolYear.start, schoolYear.end)
  const endScore = Math.max(0, Math.min(10, growth + (grade - cur) * 0.15))
  const series = mondays.map((m, i) => {
    const iso = isoDay(m)
    const stored = growthHistory.find((h) => h.studentId === student.id && h.date === iso)
    const t = mondays.length > 1 ? i / (mondays.length - 1) : 1
    const synthetic = Math.round(Math.max(0, Math.min(10, endScore - 0.9 * (1 - t))) * 10) / 10
    return { date: iso, monday: m, score: stored ? stored.score : synthetic }
  })

  // Trend from the last two weeks of the series (independent of the view).
  const prevScore = series.length >= 2 ? series[series.length - 2].score : null
  const lastScore = series.length ? series[series.length - 1].score : growth
  const growthTrend = prevScore != null ? Math.round((lastScore - prevScore) * 10) / 10 : 0

  // Today's week Monday (for the "save this week" action).
  const todayMonday = (() => {
    const d = new Date()
    const dow = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - dow)
    return isoDay(d)
  })()

  // Selectable date range within the school year (defaults to the last 12 weeks).
  const dates = series.map((s) => s.date)
  const defFrom = dates.length ? dates[Math.max(0, dates.length - 12)] : ''
  const defTo = dates.length ? dates[dates.length - 1] : ''
  const rangeFrom = fromDate ?? defFrom
  const rangeTo = toDate ?? defTo
  const lo = rangeFrom <= rangeTo ? rangeFrom : rangeTo
  const hi = rangeFrom <= rangeTo ? rangeTo : rangeFrom
  const visibleSnaps = series.filter((s) => s.date >= lo && s.date <= hi)
  const growthChart = visibleSnaps.map((s) => ({
    label: s.monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: s.score,
  }))

  const allSubjectAverages = subjectAverages(studentScores)
  const subjectAvg = (name: string) =>
    allSubjectAverages.find((s) => s.label === name)?.value ?? 0

  // Academic goals = goals tied to a subject / target score.
  const academicGoals = studentGoals.filter((g) => g.subject || g.targetScore != null)

  // ---- Badges (derived) ----
  const readingHabit = studentHabits.find((h) => /read/i.test(h.activity))
  const readingHero = readingHabit
    ? readingHabit.weeklyProgress >= readingHabit.weeklyTarget
    : false
  const consistencyChampion =
    studentHabits.length > 0 &&
    studentHabits.every((h) => h.weeklyProgress >= h.weeklyTarget)
  const doneGoalsCount = studentGoals.filter((g) => g.done).length
  const goalCrusher = doneGoalsCount >= 3
  const perfectTen = studentScores.some((s) => s.score === 10)
  const risingStar = growthTrend > 0
  const straightA = academic >= 9

  const badges = [
    { icon: '📚', name: 'Reading Hero', desc: 'Hit the weekly reading target', earned: readingHero },
    { icon: '🔥', name: 'Consistency Champion', desc: 'Met every habit goal this week', earned: consistencyChampion },
    { icon: '🏆', name: 'Goal Crusher', desc: 'Completed 3 or more goals', earned: goalCrusher },
    { icon: '💯', name: 'Perfect Ten', desc: 'Scored a perfect 10', earned: perfectTen },
    { icon: '📈', name: 'Rising Star', desc: 'Growth improved this week', earned: risingStar },
    { icon: '🌟', name: "Straight A's", desc: 'Academic score of 9+', earned: straightA },
  ]

  const trendLabel =
    growthTrend > 0
      ? `▲ +${growthTrend.toFixed(1)}`
      : growthTrend < 0
        ? `▼ ${growthTrend.toFixed(1)}`
        : '► 0.0'
  const trendClass = growthTrend > 0 ? 'up' : growthTrend < 0 ? 'down' : 'flat'

  const submitNote = (e: React.FormEvent) => {
    e.preventDefault()
    const lines = (v: string) =>
      v
        .split('\n')
        .map((l) => l.replace(/^[-•\s]+/, '').trim())
        .filter(Boolean)
    const well = lines(wentWell)
    const improve = lines(toImprove)
    const next = lines(nextGoals)
    const reflect = reflection.trim()
    if (well.length === 0 && improve.length === 0 && next.length === 0 && !reflect) return
    addJournalEntry({
      studentId: student.id,
      date: new Date().toISOString().slice(0, 10),
      wentWell: well,
      toImprove: improve,
      nextGoals: next,
      parentReflection: reflect,
    })
    setWentWell('')
    setToImprove('')
    setNextGoals('')
    setReflection('')
  }

  const hasJournalInput =
    !!wentWell.trim() || !!toImprove.trim() || !!nextGoals.trim() || !!reflection.trim()

  const streak = currentStreak(checkIns)

  const startEditYear = () => {
    setYearStartInput(isoDay(schoolYear.start))
    setYearEndInput(isoDay(schoolYear.end))
    setEditingYear(true)
  }
  const saveYear = () => {
    if (yearStartInput && yearEndInput) {
      setSchoolYear(student.id, grade, yearStartInput, yearEndInput)
    }
    setEditingYear(false)
  }
  const resetYear = () => {
    resetSchoolYear(student.id, grade)
    setEditingYear(false)
  }

  const addAcademicGoal = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = newAcadSubject.trim()
    if (!subject) return
    const target = Number(newAcadTarget) || 0
    addGoal({
      studentId: student.id,
      title: `${subject} ≥ ${target}`,
      rewardId: '',
      done: false,
      subject,
      targetScore: target,
      points: 20,
    })
    setNewAcadSubject('')
    setNewAcadTarget('8')
  }

  const addHabit = (e: React.FormEvent) => {
    e.preventDefault()
    const activity = newHabitActivity.trim()
    if (!activity) return
    addHabitGoal({
      studentId: student.id,
      activity,
      icon: newHabitIcon.trim() || '🎯',
      unit: newHabitUnit.trim() || 'minutes',
      weeklyTarget: Number(newHabitTarget) || 0,
      weeklyProgress: 0,
    })
    setNewHabitActivity('')
    setNewHabitIcon('🎯')
    setNewHabitUnit('minutes')
    setNewHabitTarget('120')
  }

  return (
    <div className="page">
      <div className="student-head big">
        <Avatar student={student} size={64} editable />
        <div>
          <h1>{student.name}</h1>
          <span className="muted">{student.grade}</span>
          <span className="photo-hint">📷 Click the photo to change it</span>
        </div>
        <div className="student-head-actions">
          <button type="button" className="btn primary" onClick={() => setCheckInOpen(true)}>
            ⚡ Quick Check-In
          </button>
          {streak > 0 && (
            <span className="streak-pill" title="Daily check-in streak">
              🔥 {streak}-day streak
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="student-tabs" role="tablist" aria-label="Student sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`student-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
            style={tab === t.id ? { borderColor: student.color, color: student.color } : undefined}
          >
            <span aria-hidden="true">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ---------- TAB 1: PROGRESS ---------- */}
      {tab === 'progress' && (
        <>
          <div className="score-cards">
            <div className="score-card growth-main" style={{ borderTopColor: student.color }}>
              <span className="score-card-label">Growth Score</span>
              <span className="score-card-value">{growth.toFixed(1)}</span>
              <span className="score-card-unit">/10</span>
              <span className="score-breakdown">
                🎓 Academic {academic.toFixed(2)} · 🔥 Habit {habit.toFixed(1)}
              </span>
            </div>
            <div className="score-card">
              <span className="score-card-label">Academic (70%)</span>
              <span className="score-card-value">{academic.toFixed(2)}</span>
              <span className="score-card-unit">/10</span>
            </div>
            <div className="score-card">
              <span className="score-card-label">Habit (30%)</span>
              <span className="score-card-value">{habit.toFixed(1)}</span>
              <span className="score-card-unit">/10</span>
            </div>
            <div className="score-card">
              <span className="score-card-label">Growth Trend</span>
              <span className={`score-card-value ${trendClass}`}>{trendLabel}</span>
              <span className="score-card-unit">vs last week</span>
            </div>
          </div>

          <section className="card">
            <div className="growth-history-head">
              <h2>📈 Growth History</h2>
              <button
                type="button"
                className="btn"
                onClick={() => snapshotGrowth(student.id, todayMonday, growth)}
                title="Save this week's growth score"
              >
                📅 Save this week
              </button>
            </div>
            <p className="muted">
              Grade {grade} school year · pick a week range to see the trend.
            </p>

            <div className="week-range">
              <label className="week-range-field">
                <span>From</span>
                <select value={rangeFrom} onChange={(e) => setFromDate(e.target.value)}>
                  {series.map((s) => (
                    <option key={s.date} value={s.date}>
                      {dayLabel(s.monday)}
                    </option>
                  ))}
                </select>
              </label>
              <span className="week-range-arrow">→</span>
              <label className="week-range-field">
                <span>To</span>
                <select value={rangeTo} onChange={(e) => setToDate(e.target.value)}>
                  {series.map((s) => (
                    <option key={s.date} value={s.date}>
                      {dayLabel(s.monday)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="week-range-quick">
                <button
                  type="button"
                  className="week-chip-btn"
                  onClick={() => {
                    setFromDate(dates[Math.max(0, dates.length - 4)])
                    setToDate(dates[dates.length - 1])
                  }}
                >
                  4w
                </button>
                <button
                  type="button"
                  className="week-chip-btn"
                  onClick={() => {
                    setFromDate(dates[Math.max(0, dates.length - 12)])
                    setToDate(dates[dates.length - 1])
                  }}
                >
                  12w
                </button>
                <button
                  type="button"
                  className="week-chip-btn"
                  onClick={() => {
                    setFromDate(dates[0])
                    setToDate(dates[dates.length - 1])
                  }}
                >
                  Full year
                </button>
              </div>
            </div>

            <p className="muted week-range-summary">
              Showing {visibleSnaps.length} week{visibleSnaps.length === 1 ? '' : 's'}
            </p>
            <LineChart data={growthChart} color={student.color} />
            <div className="growth-history-recent">
              {visibleSnaps.slice(-4).map((s) => (
                <span key={s.date} className="gh-chip">
                  {s.monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ·{' '}
                  <strong>{s.score.toFixed(1)}</strong>
                </span>
              ))}
            </div>
          </section>

          <section className="grade-nav">
            <div className="grade-nav-head">
              <h2>Track by grade</h2>
              <span className="muted">Select a grade to see results for that school year.</span>
            </div>
            <div className="grade-tabs" role="tablist" aria-label="Grades">
              {gradeOptions.map((g) => {
                const count = countForGrade(g)
                return (
                  <button
                    key={g}
                    role="tab"
                    aria-selected={g === grade}
                    className={`grade-tab${g === grade ? ' active' : ''}${count === 0 ? ' empty' : ''}`}
                    onClick={() => setSelectedGrade(g)}
                    style={g === grade ? { borderColor: student.color, color: student.color } : undefined}
                  >
                    Grade {g}
                    {count > 0 && <span className="grade-tab-count">{count}</span>}
                    {g === cur && <span className="grade-tab-now" title="Current grade">•</span>}
                  </button>
                )
              })}
            </div>

            <div className="school-year-box" style={{ borderColor: student.color }}>
              <span className="sy-icon" style={{ background: student.color }}>
                📅
              </span>
              {editingYear ? (
                <div className="sy-edit">
                  <label>
                    Start
                    <input
                      type="date"
                      value={yearStartInput}
                      onChange={(e) => setYearStartInput(e.target.value)}
                    />
                  </label>
                  <label>
                    End
                    <input
                      type="date"
                      value={yearEndInput}
                      onChange={(e) => setYearEndInput(e.target.value)}
                    />
                  </label>
                  <div className="sy-edit-actions">
                    <button type="button" className="btn primary" onClick={saveYear}>
                      Save
                    </button>
                    <button type="button" className="btn" onClick={() => setEditingYear(false)}>
                      Cancel
                    </button>
                    {override && (
                      <button type="button" className="btn" onClick={resetYear} title="Reset to default">
                        ↺ Reset
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="sy-text">
                    <span className="sy-title">
                      Grade {grade} · School year {schoolYear.label}
                      {override && <span className="sy-custom">custom</span>}
                    </span>
                    <span className="sy-range">{schoolYear.range}</span>
                  </div>
                  <button
                    type="button"
                    className="sy-edit-btn"
                    onClick={startEditYear}
                    title="Edit school year dates"
                  >
                    ✏️ Edit
                  </button>
                </>
              )}
            </div>
          </section>

          <div className="stat-row card">
            <div className="stat">
              <span className="stat-value">{averageScore(gradeScores)}</span>
              <span className="stat-label">Grade {grade} avg</span>
            </div>
            <div className="stat">
              <span className="stat-value">{semesterAverage(gradeScores, 'first')}</span>
              <span className="stat-label">1st semester</span>
            </div>
            <div className="stat">
              <span className="stat-value">{semesterAverage(gradeScores, 'second')}</span>
              <span className="stat-label">2nd semester</span>
            </div>
            <div className="stat">
              <span className="stat-value">{gradeScores.length}</span>
              <span className="stat-label">Records</span>
            </div>
          </div>

          {gradeScores.length === 0 ? (
            <section className="card empty-grade">
              <p className="muted">
                No scores recorded for <strong>Grade {grade}</strong> yet.
              </p>
              <Link to="/add-score" className="btn primary">
                ➕ Add a Grade {grade} score
              </Link>
            </section>
          ) : (
            <>
              <section className="card">
                <h2>Average by subject · Grade {grade}</h2>
                <BarChart data={subjects} />

                {subjects.length > 0 && (
                  <div className="subject-adjusters">
                    <p className="muted adjuster-hint">
                      Drag to adjust a subject's average (0–10) — recent scores update live.
                    </p>
                    {subjects.map(({ label, value }) => (
                      <label key={label} className="adjuster">
                        <span className="adjuster-label">
                          <SubjectLogo subject={label} color={subjectColor(label)} size={22} />
                          {label}
                        </span>
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
                <h2>Recent scores · Grade {grade}</h2>
                <ul className="list">
                  {recent.map((s) => (
                    <li key={s.id} className="list-row">
                      <span className="list-subject">
                        <SubjectLogo subject={s.subject} color={subjectColor(s.subject)} size={22} />
                        {s.subject}
                      </span>
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
              </section>
            </>
          )}
        </>
      )}

      {/* ---------- TAB 2: GOALS ---------- */}
      {tab === 'goals' && (
        <>
          <section className="card">
            <h2>📚 Academic Goals</h2>
            <p className="muted">Target a minimum average per subject. Everything is editable.</p>
            {academicGoals.length === 0 ? (
              <p className="muted">No academic goals yet. Add one below.</p>
            ) : (
              <ul className="goal-target-list">
                {academicGoals.map((g) => {
                  const color = g.subject ? subjectColor(g.subject) : student.color
                  const current = g.subject ? subjectAvg(g.subject) : 0
                  const target = g.targetScore ?? 0
                  const pct = target
                    ? Math.min(100, Math.round((current / target) * 100))
                    : g.done
                      ? 100
                      : 0
                  const gradient = `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 45%, #ffffff))`
                  return (
                    <li key={g.id} className="goal-target">
                      <button
                        className="goal-target-check"
                        onClick={() => toggleGoal(g.id)}
                        title={g.done ? 'Mark not done' : 'Mark done'}
                      >
                        {g.done ? '✅' : '⬜'}
                      </button>
                      <div className="goal-target-main">
                        <div className="goal-target-title">
                          {g.subject && (
                            <SubjectLogo subject={g.subject} color={color} size={20} />
                          )}
                          <input
                            className="goal-inline-input goal-inline-subject"
                            value={g.subject ?? ''}
                            placeholder="Subject"
                            onChange={(e) =>
                              updateGoal(g.id, {
                                subject: e.target.value,
                                title: `${e.target.value} ≥ ${g.targetScore ?? 0}`,
                              })
                            }
                            aria-label="Subject"
                          />
                          <span className="goal-inline-op">≥</span>
                          <input
                            className="goal-inline-input goal-inline-target"
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            value={g.targetScore ?? 0}
                            onChange={(e) =>
                              updateGoal(g.id, {
                                targetScore: Number(e.target.value),
                                title: `${g.subject ?? ''} ≥ ${Number(e.target.value)}`,
                              })
                            }
                            aria-label="Target score"
                          />
                          <span className="muted goal-target-now">now {current}/10</span>
                        </div>
                        <span className="goal-target-bar">
                          <span
                            className="goal-target-fill"
                            style={{ width: `${pct}%`, background: gradient }}
                          />
                        </span>
                      </div>
                      <button
                        className="row-delete"
                        onClick={() => deleteGoal(g.id)}
                        aria-label={`Delete ${g.subject ?? g.title}`}
                        title="Delete goal"
                      >
                        🗑
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            <form className="goal-add-inline" onSubmit={addAcademicGoal}>
              <input
                type="text"
                value={newAcadSubject}
                placeholder="Subject (e.g. Math)"
                onChange={(e) => setNewAcadSubject(e.target.value)}
                aria-label="New subject"
              />
              <span className="goal-inline-op">≥</span>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={newAcadTarget}
                onChange={(e) => setNewAcadTarget(e.target.value)}
                aria-label="New target score"
              />
              <button type="submit" className="btn primary" disabled={!newAcadSubject.trim()}>
                ➕ Add
              </button>
            </form>
          </section>

          <section className="card">
            <h2>⏱️ Habit Goals</h2>
            <p className="muted">Weekly habits in minutes or sessions. Drag to log progress.</p>
            {studentHabits.length === 0 ? (
              <p className="muted">No habit goals yet. Add one below.</p>
            ) : (
              <ul className="habit-list">
                {studentHabits.map((h) => {
                  const color = subjectColor(h.activity)
                  const usableColor = color === '#64748b' ? student.color : color
                  const pct = habitPct(h)
                  const met = h.weeklyProgress >= h.weeklyTarget && h.weeklyTarget > 0
                  const unitLabel = `${h.unit}/week`
                  const gradient = met
                    ? 'linear-gradient(90deg, #16a34a, #4ade80)'
                    : `linear-gradient(90deg, ${usableColor}, color-mix(in srgb, ${usableColor} 45%, #ffffff))`
                  return (
                    <li key={h.id} className="habit-row">
                      <div className="habit-head">
                        <span className="habit-name">
                          <input
                            className="habit-icon-input"
                            value={h.icon}
                            maxLength={2}
                            onChange={(e) => updateHabitGoal(h.id, { icon: e.target.value })}
                            aria-label="Icon"
                          />
                          <input
                            className="goal-inline-input habit-activity-input"
                            value={h.activity}
                            onChange={(e) => updateHabitGoal(h.id, { activity: e.target.value })}
                            aria-label="Activity"
                          />
                        </span>
                        <span className="habit-controls">
                          <input
                            className="goal-inline-input habit-target-input"
                            type="number"
                            min={0}
                            value={h.weeklyTarget}
                            onChange={(e) =>
                              updateHabitGoal(h.id, { weeklyTarget: Number(e.target.value) || 0 })
                            }
                            aria-label="Weekly target"
                          />
                          <input
                            className="goal-inline-input habit-unit-input"
                            list="habit-units"
                            value={h.unit}
                            onChange={(e) => updateHabitGoal(h.id, { unit: e.target.value })}
                            aria-label="Unit"
                            placeholder="unit"
                          />
                          <button
                            className="row-delete"
                            onClick={() => deleteHabitGoal(h.id)}
                            aria-label={`Delete ${h.activity}`}
                            title="Delete habit"
                          >
                            🗑
                          </button>
                        </span>
                      </div>
                      <span className="habit-bar">
                        <span className="habit-fill" style={{ width: `${pct}%`, background: gradient }} />
                      </span>
                      <div className="habit-foot">
                        <input
                          type="range"
                          min={0}
                          max={h.weeklyTarget || 1}
                          step={h.unit === 'minutes' ? 5 : 1}
                          value={Math.min(h.weeklyProgress, h.weeklyTarget || h.weeklyProgress)}
                          onChange={(e) =>
                            updateHabitGoal(h.id, { weeklyProgress: Number(e.target.value) })
                          }
                          style={{ accentColor: usableColor }}
                          aria-label={`Log progress for ${h.activity}`}
                        />
                        <span className={`habit-mins${met ? ' met' : ''}`}>
                          {h.weeklyProgress}/{h.weeklyTarget} {unitLabel} {met && '✓'}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            <form className="goal-add-inline habit-add" onSubmit={addHabit}>
              <input
                className="habit-icon-input"
                value={newHabitIcon}
                maxLength={2}
                onChange={(e) => setNewHabitIcon(e.target.value)}
                aria-label="New habit icon"
              />
              <input
                type="text"
                value={newHabitActivity}
                placeholder="Activity (e.g. Coding)"
                onChange={(e) => setNewHabitActivity(e.target.value)}
                aria-label="New activity"
              />
              <input
                type="number"
                min={0}
                value={newHabitTarget}
                onChange={(e) => setNewHabitTarget(e.target.value)}
                aria-label="New weekly target"
              />
              <input
                className="goal-inline-input habit-unit-input"
                list="habit-units"
                value={newHabitUnit}
                onChange={(e) => setNewHabitUnit(e.target.value)}
                aria-label="New unit"
                placeholder="unit"
              />
              <button type="submit" className="btn primary" disabled={!newHabitActivity.trim()}>
                ➕ Add
              </button>
            </form>
            <datalist id="habit-units">
              <option value="minutes" />
              <option value="sessions" />
              <option value="pages" />
              <option value="tasks" />
            </datalist>
          </section>
        </>
      )}

      {/* ---------- TAB 3: ACHIEVEMENTS ---------- */}
      {tab === 'achievements' && (
        <section className="card">
          <h2>🏆 Achievements</h2>
          <p className="muted">
            {badges.filter((b) => b.earned).length} of {badges.length} badges earned.
          </p>
          <div className="badge-collection">
            {badges.map((b) => (
              <div key={b.name} className={`badge-card${b.earned ? ' earned' : ' locked'}`}>
                <span className="badge-card-icon">{b.earned ? b.icon : '🔒'}</span>
                <span className="badge-card-name">{b.name}</span>
                <span className="badge-card-desc">{b.desc}</span>
                {b.earned && <span className="badge-card-tag">Earned</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- TAB 4: GROWTH JOURNAL ---------- */}
      {tab === 'journal' && (
        <section className="card">
          <h2>❤️ Growth Journal</h2>
          <p className="muted">A weekly reflection on {student.name}'s growth journey.</p>

          <form className="journal-form" onSubmit={submitNote}>
            <label className="journal-field">
              <span className="journal-field-label went-well">✅ What went well</span>
              <textarea
                value={wentWell}
                onChange={(e) => setWentWell(e.target.value)}
                placeholder={'One per line, e.g.\nSelf-motivated learning\nCompleted homework on time'}
                rows={3}
              />
            </label>
            <label className="journal-field">
              <span className="journal-field-label to-improve">🎯 What to improve</span>
              <textarea
                value={toImprove}
                onChange={(e) => setToImprove(e.target.value)}
                placeholder={'One per line, e.g.\nNeeds more focus during English'}
                rows={3}
              />
            </label>
            <label className="journal-field">
              <span className="journal-field-label next-goals">🚀 Goals for next week</span>
              <textarea
                value={nextGoals}
                onChange={(e) => setNextGoals(e.target.value)}
                placeholder={'One per line, e.g.\nRead for 120 minutes\nPractice sports'}
                rows={3}
              />
            </label>
            <label className="journal-field">
              <span className="journal-field-label reflection">❤️ Parent reflection</span>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="e.g. I'm so proud you've kept up your reading consistently."
                rows={2}
              />
            </label>
            <button type="submit" className="btn primary" disabled={!hasJournalInput}>
              ＋ Save reflection
            </button>
          </form>

          {studentJournal.length === 0 ? (
            <p className="muted">No journal entries yet. Add the first one above.</p>
          ) : (
            <ul className="journal-list">
              {studentJournal.map((entry) => (
                <li key={entry.id} className="journal-entry">
                  <div className="journal-entry-head">
                    <span className="journal-date">📅 {entry.date}</span>
                    <button
                      className="row-delete"
                      onClick={() => deleteJournalEntry(entry.id)}
                      aria-label="Delete entry"
                      title="Delete entry"
                    >
                      🗑
                    </button>
                  </div>

                  {entry.wentWell?.length > 0 && (
                    <div className="journal-section">
                      <span className="journal-section-title went-well">✅ What went well</span>
                      <ul>
                        {entry.wentWell.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.toImprove?.length > 0 && (
                    <div className="journal-section">
                      <span className="journal-section-title to-improve">🎯 What to improve</span>
                      <ul>
                        {entry.toImprove.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.nextGoals?.length > 0 && (
                    <div className="journal-section">
                      <span className="journal-section-title next-goals">🚀 Goals for next week</span>
                      <ul>
                        {entry.nextGoals.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.parentReflection && (
                    <blockquote className="journal-reflection">
                      ❤️ {entry.parentReflection}
                    </blockquote>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="quick-actions">
        <Link to="/add-score" className="btn primary">
          ➕ Add score for {student.name}
        </Link>
      </div>

      {checkInOpen && (
        <QuickCheckIn studentId={student.id} onClose={() => setCheckInOpen(false)} />
      )}
    </div>
  )
}
