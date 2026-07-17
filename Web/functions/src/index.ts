/**
 * Cloud Functions for the family growth tracker (Firebase backend).
 * See Firebase_Architecture.md §5.
 *
 * - generateWeeklySnapshots  — scheduled every Sunday; writes weeklySnapshots.
 * - generateFamilySummary    — scheduled monthly; writes familySummaries.
 * - onMembershipWrite        — mirrors role/familyId into custom auth claims.
 *
 * Install deps and deploy:
 *   cd functions && npm install && npm run build && firebase deploy --only functions
 */
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { defineSecret } from 'firebase-functions/params'
import { logger } from 'firebase-functions'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

initializeApp()
const db = getFirestore()

/**
 * Optional AI provider key. Set once with:
 *   firebase functions:secrets:set AI_API_KEY
 * When present, monthly summaries are written by the AI; otherwise a
 * deterministic (computed) narrative is used. Base URL / model are overridable
 * via the AI_BASE_URL / AI_MODEL environment variables.
 */
const AI_API_KEY = defineSecret('AI_API_KEY')

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function isoWeek(date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function mondayIso(date = new Date()): string {
  const d = new Date(date)
  const dow = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dow)
  return d.toISOString().slice(0, 10)
}

function round(n: number, dp = 2): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

/* ------------------------------------------------------------------ */
/* Weekly snapshot job — every Sunday 23:00 UTC                        */
/* ------------------------------------------------------------------ */

export const generateWeeklySnapshots = onSchedule('0 23 * * 0', async () => {
  const year = new Date().getFullYear()
  const week = isoWeek()
  const weekStart = mondayIso()

  const children = await db.collection('children').get()
  logger.info(`Weekly snapshot for ${children.size} children (W${week} ${year})`)

  for (const child of children.docs) {
    const childId = child.id
    const familyId = child.get('familyId')

    const scoresSnap = await db.collection('scores').where('childId', '==', childId).get()
    const scores = scoresSnap.docs.map((d) => d.get('score') as number)
    const academic = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

    const habitsSnap = await db.collection('habits').where('childId', '==', childId).get()
    const habitPcts = habitsSnap.docs.map((d) => {
      const target = (d.get('targetWeeklyValue') as number) || 0
      const progress = (d.get('weeklyProgress') as number) || 0
      return target > 0 ? Math.min(100, (progress / target) * 100) : 0
    })
    const habit = habitPcts.length
      ? habitPcts.reduce((a, b) => a + b, 0) / habitPcts.length / 10
      : 0

    const growth = round(academic * 0.7 + habit * 0.3, 1)

    await db.collection('weeklySnapshots').doc(`${childId}_${year}W${week}`).set(
      {
        familyId,
        childId,
        year,
        weekNumber: week,
        weekStart,
        academicScore: round(academic),
        habitScore: round(habit, 1),
        growthScore: growth,
      },
      { merge: true },
    )
  }
})

/* ------------------------------------------------------------------ */
/* Monthly AI family summary — last day of month 08:00 UTC             */
/* (cron guarded to run only on the final day)                         */
/* ------------------------------------------------------------------ */

interface ChildStat {
  name: string
  grade: string
  growthFrom: number
  growthTo: number
  goalsDone: number
  goalsTotal: number
  completedSubjects: string[]
  habitPct: number
  monthSubjects: string[]
}

/** Prompt sent to the AI provider to turn stats into a warm narrative. */
function buildPrompt(month: string, familyName: string, stats: ChildStat[]): string {
  const rows = stats
    .map(
      (s) =>
        `- ${s.name} (${s.grade || 'n/a'}): growth ${s.growthFrom}→${s.growthTo}; ` +
        `goals ${s.goalsDone}/${s.goalsTotal} done [${s.completedSubjects.join(', ') || 'none'}]; ` +
        `habits ${s.habitPct}%; subjects this month: ${s.monthSubjects.join(', ') || 'none'}`,
    )
    .join('\n')
  return (
    `Write a warm, encouraging monthly learning summary for the ${familyName} for ${month}. ` +
    `Use a parent-friendly tone, 2–3 sentences per child, and celebrate progress while gently ` +
    `noting where to focus. Do not invent data. Data:\n${rows}`
  )
}

/** Deterministic fallback narrative when no AI provider is configured. */
function deterministicNarrative(month: string, familyName: string, stats: ChildStat[]): string {
  const header = `📈 ${familyName} — Monthly Summary (${month})`
  if (stats.length === 0) return `${header}\n\nNo children tracked yet.`
  const body = stats
    .map((s) => {
      const growth =
        s.growthTo > s.growthFrom
          ? `improved their growth score from ${s.growthFrom} to ${s.growthTo}`
          : s.growthTo < s.growthFrom
            ? `held a growth score of ${s.growthTo} (from ${s.growthFrom})`
            : `sustained a steady growth score of ${s.growthTo}`
      const goals = s.goalsTotal
        ? ` Completed ${s.goalsDone}/${s.goalsTotal} goals` +
          (s.completedSubjects.length ? ` (${s.completedSubjects.join(', ')}).` : '.')
        : ''
      const subjects = s.monthSubjects.length
        ? ` Subjects this month: ${s.monthSubjects.join(', ')}.`
        : ''
      const habit = s.habitPct ? ` Habits at ${s.habitPct}%.` : ''
      const emoji = s.habitPct >= 90 ? '🎉' : s.habitPct >= 75 ? '👏' : '💪'
      return `• ${s.name}${s.grade ? ` (${s.grade})` : ''} ${growth}.${goals}${subjects}${habit} ${emoji}`
    })
    .join('\n')
  return `${header}\n\n${body}`
}

/** Call an OpenAI-compatible chat endpoint; returns null on any failure. */
async function callAiNarrative(prompt: string, apiKey: string): Promise<string | null> {
  if (!apiKey) return null
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.AI_MODEL || 'gpt-4o-mini'
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 600,
        messages: [
          { role: 'system', content: 'You are a supportive family learning coach.' },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) {
      logger.warn(`AI provider returned ${res.status}`)
      return null
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } catch (err) {
    logger.error('AI call failed', err)
    return null
  }
}

export const generateFamilySummary = onSchedule(
  { schedule: '0 8 28-31 * *', secrets: [AI_API_KEY] },
  async () => {
    const now = new Date()
    const isLastDay =
      new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() === now.getDate()
    if (!isLastDay) {
      logger.info('Not the last day of the month — skipping family summary.')
      return
    }

    const monthKey = now.toISOString().slice(0, 7) // yyyy-mm
    const families = await db.collection('families').get()

    for (const family of families.docs) {
      const familyId = family.id
      const familyName = (family.get('name') as string) || 'Family'
      const children = await db.collection('children').where('familyId', '==', familyId).get()

      const stats: ChildStat[] = []
      for (const child of children.docs) {
        const cid = child.id

        const snapsSnap = await db
          .collection('weeklySnapshots')
          .where('childId', '==', cid)
          .orderBy('weekStart')
          .get()
        const snaps = snapsSnap.docs.map((d) => d.get('growthScore') as number)
        const growthFrom = snaps.length ? snaps[Math.max(0, snaps.length - 5)] : 0
        const growthTo = snaps.length ? snaps[snaps.length - 1] : 0

        const goalsSnap = await db.collection('academicGoals').where('childId', '==', cid).get()
        const doneGoals = goalsSnap.docs.filter((d) => d.get('done'))
        const completedSubjects = doneGoals
          .map((d) => (d.get('subject') as string) || (d.get('title') as string))
          .filter(Boolean)

        const habitsSnap = await db.collection('habits').where('childId', '==', cid).get()
        const pcts = habitsSnap.docs.map((d) => {
          const target = (d.get('targetWeeklyValue') as number) || 0
          const progress = (d.get('weeklyProgress') as number) || 0
          return target > 0 ? Math.min(100, (progress / target) * 100) : 0
        })
        const habitPct = pcts.length
          ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
          : 0

        const scoresSnap = await db.collection('scores').where('childId', '==', cid).get()
        const monthSubjects = [
          ...new Set(
            scoresSnap.docs
              .filter((d) => ((d.get('date') as string) || '').startsWith(monthKey))
              .map((d) => d.get('subject') as string),
          ),
        ]

        stats.push({
          name: (child.get('name') as string) || 'Child',
          grade: (child.get('grade') as string) || '',
          growthFrom,
          growthTo,
          goalsDone: doneGoals.length,
          goalsTotal: goalsSnap.size,
          completedSubjects,
          habitPct,
          monthSubjects,
        })
      }

      // Prefer an AI narrative when a provider key is configured; else compute one.
      const ai = await callAiNarrative(
        buildPrompt(monthKey, familyName, stats),
        AI_API_KEY.value(),
      )
      const summary = ai ?? deterministicNarrative(monthKey, familyName, stats)

      await db.collection('familySummaries').doc(`${familyId}_${monthKey}`).set(
        {
          familyId,
          month: monthKey,
          summary,
          source: ai ? 'ai' : 'computed',
          generatedAt: new Date().toISOString(),
        },
        { merge: true },
      )
    }

    logger.info(`Generated ${families.size} family summaries for ${monthKey}`)
  },
)

/* ------------------------------------------------------------------ */
/* Mirror membership role/familyId into custom auth claims             */
/* ------------------------------------------------------------------ */

export const onMembershipWrite = onDocumentWritten('familyMembers/{memberId}', async (event) => {
  const after = event.data?.after?.data()
  if (!after) return // deleted — leave existing claims or clear as needed
  const { userId, familyId, role } = after as {
    userId: string
    familyId: string
    role: string
  }
  try {
    await getAuth().setCustomUserClaims(userId, { familyId, role })
    logger.info(`Set claims for ${userId}: family=${familyId} role=${role}`)
  } catch (err) {
    logger.error('Failed to set custom claims', err)
  }
})
