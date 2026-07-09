import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../store-context'
import { averageScore, subjectAverages } from '../utils/scores'
import type { Goal, Reward, ScoreEntry, Student } from '../types'

interface ChatMessage {
  id: string
  role: 'user' | 'tutor'
  text: string
}

interface TutorData {
  students: Student[]
  scores: ScoreEntry[]
  goals: Goal[]
  rewards: Reward[]
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

function pointsFor(studentId: string, data: TutorData) {
  const goals = data.goals.filter((g) => g.studentId === studentId)
  const earned = goals.filter((g) => g.done).reduce((sum, g) => sum + g.points, 0)
  const claimedRewardIds = new Set(
    goals.filter((g) => g.done).map((g) => g.rewardId),
  )
  const spent = data.rewards
    .filter((r) => r.claimed && claimedRewardIds.has(r.id))
    .reduce((sum, r) => sum + r.cost, 0)
  return { earned, spent, available: earned - spent }
}

function findStudent(text: string, data: TutorData): Student | undefined {
  const q = norm(text)
  return data.students.find((s) => {
    const tokens = norm(s.name)
      .split(/\s+/)
      .filter((t) => t.length > 2)
    return tokens.some((t) => q.includes(t))
  })
}

function progressLine(student: Student, data: TutorData): string {
  const scores = data.scores.filter((s) => s.studentId === student.id)
  if (scores.length === 0) return `${student.avatar} ${student.name} has no scores recorded yet.`
  const avg = averageScore(scores)
  const subjects = subjectAverages(scores).sort((a, b) => b.value - a.value)
  const best = subjects[0]
  const weakest = subjects[subjects.length - 1]
  const pts = pointsFor(student.id, data)
  const openGoals = data.goals.filter((g) => g.studentId === student.id && !g.done)
  const parts = [
    `${student.avatar} ${student.name} — overall average ${avg}/10.`,
    `Strongest: ${best.label} (${best.value}). Needs focus: ${weakest.label} (${weakest.value}).`,
    `Reward points available: ${pts.available} (earned ${pts.earned}, spent ${pts.spent}).`,
    openGoals.length
      ? `Open goals: ${openGoals.map((g) => g.title).join(', ')}.`
      : `All goals completed — great job! 🎉`,
  ]
  return parts.join('\n')
}

function studyTip(student: Student | undefined, data: TutorData): string {
  const target = student ?? data.students[0]
  if (!target) return 'Add a student to get personalised study tips.'
  const scores = data.scores.filter((s) => s.studentId === target.id)
  if (scores.length === 0) {
    return `Start by recording a few scores for ${target.name}, then I can suggest where to focus.`
  }
  const subjects = subjectAverages(scores).sort((a, b) => a.value - b.value)
  const weakest = subjects[0]
  const tips: Record<string, string> = {
    default: `Break study into short 20-minute sessions with a 5-minute break, and review mistakes the next day.`,
    math: `Practise 5 mixed problems daily and re-work any wrong answers until the method feels automatic.`,
    science: `Turn each topic into a "why does this happen?" question and explain the answer out loud.`,
    english: `Read 15 minutes a day and note 3 new words to reuse in a sentence.`,
    reading: `Ask "what happens next and why?" after each page to build comprehension.`,
    writing: `Write a 3-sentence summary of the day — focus on one clear idea per sentence.`,
    history: `Build a simple timeline and connect each event to its cause and effect.`,
    art: `Keep a small sketchbook and try one new technique each week.`,
    music: `Practise a little every day — 10 focused minutes beats one long weekly session.`,
  }
  const key = norm(weakest.label)
  const tip = tips[key] ?? tips.default
  return `For ${target.name}, ${weakest.label} (avg ${weakest.value}) could use attention.\n💡 ${tip}`
}

function buildAnswer(question: string, data: TutorData): string {
  const q = norm(question)
  const mentioned = findStudent(question, data)

  if (!q) return `Ask me anything about your children's learning progress!`

  // Greetings
  if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(q)) {
    const names = data.students.map((s) => s.name.split(' ').slice(-1)[0]).join(' and ')
    return `Hi! 👋 I'm your AI Tutor. I can share progress updates for ${names}, suggest study tips, and track goals & reward points. What would you like to know?`
  }

  // Study tips
  if (/(tip|advice|help.*(study|improve)|how.*(improve|better)|suggest|recommend|focus)/.test(q)) {
    return studyTip(mentioned, data)
  }

  // Goals
  if (/(goal|task|to.?do|todo)/.test(q)) {
    const list = mentioned
      ? data.goals.filter((g) => g.studentId === mentioned.id)
      : data.goals
    if (list.length === 0) return `No goals set yet. Head to the Goals page to add one.`
    const done = list.filter((g) => g.done).length
    const lines = list
      .map((g) => {
        const who = data.students.find((s) => s.id === g.studentId)
        return `${g.done ? '✅' : '⬜'} ${who?.avatar ?? ''} ${g.title} (+${g.points} pts)`
      })
      .join('\n')
    return `Goals (${done}/${list.length} done):\n${lines}`
  }

  // Rewards / points
  if (/(reward|point|prize|redeem|claim)/.test(q)) {
    if (mentioned) {
      const pts = pointsFor(mentioned.id, data)
      return `${mentioned.avatar} ${mentioned.name} has ${pts.available} points available (earned ${pts.earned}, spent ${pts.spent}). Claim rewards on the Goals page.`
    }
    const lines = data.students
      .map((s) => {
        const pts = pointsFor(s.id, data)
        return `${s.avatar} ${s.name}: ${pts.available} pts available`
      })
      .join('\n')
    const available = data.rewards.filter((r) => !r.claimed)
    const rewardList = available.length
      ? `\nUnclaimed rewards: ${available.map((r) => `${r.icon} ${r.name} (${r.cost} pts)`).join(', ')}`
      : ''
    return `Reward points:\n${lines}${rewardList}`
  }

  // Best / strongest subject
  if (/(best|strong|top|highest|good at)/.test(q)) {
    const target = mentioned ?? data.students[0]
    const scores = data.scores.filter((s) => s.studentId === target.id)
    if (scores.length === 0) return `No scores yet for ${target.name}.`
    const subjects = subjectAverages(scores).sort((a, b) => b.value - a.value)
    return `${target.avatar} ${target.name}'s strongest subject is ${subjects[0].label} with an average of ${subjects[0].value}/10. 🌟`
  }

  // Weakest subject
  if (/(weak|worst|lowest|struggl|behind|bad at)/.test(q)) {
    const target = mentioned ?? data.students[0]
    const scores = data.scores.filter((s) => s.studentId === target.id)
    if (scores.length === 0) return `No scores yet for ${target.name}.`
    const subjects = subjectAverages(scores).sort((a, b) => a.value - b.value)
    return `${target.avatar} ${target.name} could focus on ${subjects[0].label} (average ${subjects[0].value}/10).\n💡 ${studyTip(target, data)}`
  }

  // Average / score / progress / how is X doing
  if (/(average|avg|score|progress|doing|update|how.*(is|are)|report|summary|overview)/.test(q)) {
    if (mentioned) return progressLine(mentioned, data)
    return data.students.map((s) => progressLine(s, data)).join('\n\n')
  }

  // Add score guidance
  if (/(add|record|enter|log).*(score|grade|mark|result)/.test(q)) {
    return `To record a new result, open the Add Score page (➕), pick the child, enter the subject, a score from 0–10, and the date.`
  }

  // Mentioned a child but no clear intent → progress
  if (mentioned) return progressLine(mentioned, data)

  // Fallback
  return `I can help with:\n• Progress updates ("How is Hiếu doing?")\n• Study tips ("Where should Hân focus?")\n• Goals & reward points ("Show goals")\n• Best / weakest subjects\nTry one of the quick questions below. 👇`
}

const QUICK_PROMPTS = [
  'How are the kids doing?',
  'Give a study tip',
  'Show goals',
  'Reward points',
]

export default function AITutor() {
  const { students, scores, goals, rewards } = useAppData()
  const navigate = useNavigate()
  const data = useMemo<TutorData>(
    () => ({ students, scores, goals, rewards }),
    [students, scores, goals, rewards],
  )

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'tutor',
      text: `Hi! 👋 I'm your AI Tutor. Ask me about your children's progress, study tips, goals, or reward points.`,
    },
  ])
  const bodyRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)

  useEffect(() => {
    if (open && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [messages, open])

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const userMsg: ChatMessage = { id: `u${++idRef.current}`, role: 'user', text: trimmed }
    const reply: ChatMessage = {
      id: `t${++idRef.current}`,
      role: 'tutor',
      text: buildAnswer(trimmed, data),
    }
    setMessages((prev) => [...prev, userMsg, reply])
    setInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    send(input)
  }

  return (
    <div className="tutor">
      {open && (
        <div className="tutor-panel" role="dialog" aria-label="AI Tutor assistant">
          <header className="tutor-head">
            <div className="tutor-title">
              <span className="tutor-badge">🤖</span>
              <div>
                <strong>AI Tutor</strong>
                <span className="tutor-sub">Ask about progress, tips & goals</span>
              </div>
            </div>
            <button
              className="tutor-close"
              onClick={() => setOpen(false)}
              aria-label="Close AI Tutor"
            >
              ✕
            </button>
          </header>

          <div className="tutor-body" ref={bodyRef}>
            {messages.map((m) => (
              <div key={m.id} className={`tutor-msg ${m.role}`}>
                {m.text.split('\n').map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </div>
            ))}
          </div>

          <div className="tutor-quick">
            {QUICK_PROMPTS.map((p) => (
              <button key={p} className="tutor-chip" onClick={() => send(p)}>
                {p}
              </button>
            ))}
            <button className="tutor-chip" onClick={() => navigate('/add-score')}>
              ➕ Add score
            </button>
          </div>

          <form className="tutor-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              placeholder="Ask the AI Tutor…"
              onChange={(e) => setInput(e.target.value)}
              aria-label="Message the AI Tutor"
            />
            <button type="submit" className="tutor-send" aria-label="Send message">
              ➤
            </button>
          </form>
        </div>
      )}

      <button
        className={`tutor-fab ${open ? 'active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close AI Tutor' : 'Open AI Tutor'}
      >
        {open ? '✕' : '🤖'}
        {!open && <span className="tutor-fab-label">AI Tutor</span>}
      </button>
    </div>
  )
}
