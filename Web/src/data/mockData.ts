import type { Goal, Reward, ScoreEntry, Student } from '../types'

export const students: Student[] = [
  {
    id: 's1',
    name: 'Nam',
    grade: 'Preparing for Grade 8',
    avatar: '👦',
    color: '#2563eb',
  },
  {
    id: 's2',
    name: 'Mai',
    grade: 'Grade 3',
    avatar: '👧',
    color: '#db2777',
  },
]

export const initialScores: ScoreEntry[] = [
  { id: 'sc1', studentId: 's1', subject: 'Math', score: 82, date: '2026-03-05' },
  { id: 'sc2', studentId: 's1', subject: 'Math', score: 88, date: '2026-04-10' },
  { id: 'sc3', studentId: 's1', subject: 'Math', score: 91, date: '2026-05-14' },
  { id: 'sc4', studentId: 's1', subject: 'Science', score: 75, date: '2026-03-20' },
  { id: 'sc5', studentId: 's1', subject: 'Science', score: 84, date: '2026-05-02' },
  { id: 'sc6', studentId: 's1', subject: 'English', score: 79, date: '2026-04-18' },
  { id: 'sc7', studentId: 's1', subject: 'English', score: 86, date: '2026-06-01' },

  { id: 'sc8', studentId: 's2', subject: 'Math', score: 90, date: '2026-03-08' },
  { id: 'sc9', studentId: 's2', subject: 'Math', score: 94, date: '2026-05-11' },
  { id: 'sc10', studentId: 's2', subject: 'Reading', score: 85, date: '2026-03-22' },
  { id: 'sc11', studentId: 's2', subject: 'Reading', score: 92, date: '2026-05-16' },
  { id: 'sc12', studentId: 's2', subject: 'Art', score: 98, date: '2026-04-27' },
]

export const initialRewards: Reward[] = [
  { id: 'r1', name: 'New football', icon: '⚽', claimed: true },
  { id: 'r2', name: 'Movie night', icon: '🎬', claimed: false },
  { id: 'r3', name: 'Trip to the zoo', icon: '🦁', claimed: false },
  { id: 'r4', name: 'Painting set', icon: '🎨', claimed: true },
]

export const initialGoals: Goal[] = [
  { id: 'g1', studentId: 's1', title: 'Score 90+ in Math', rewardId: 'r1', done: true },
  { id: 'g2', studentId: 's1', title: 'Finish science project', rewardId: 'r2', done: false },
  { id: 'g3', studentId: 's2', title: 'Read 5 books this month', rewardId: 'r3', done: false },
  { id: 'g4', studentId: 's2', title: 'Score 95+ in Art', rewardId: 'r4', done: true },
]
