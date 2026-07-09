import type { Goal, Parent, Reward, ScoreEntry, Student } from '../types'

export const parents: Parent[] = [
  { id: 'p1', name: 'Nguyễn Văn An', email: 'an.nguyen@example.com' },
]

export const students: Student[] = [
  {
    id: 's1',
    name: 'Nguyễn Bảo Hiếu',
    grade: 'Preparing for Grade 8',
    avatar: '👦',
    color: '#2563eb',
    parentId: 'p1',
    birthYear: 2013,
  },
  {
    id: 's2',
    name: 'Nguyễn Thị Bảo Hân',
    grade: 'Grade 3',
    avatar: '👧',
    color: '#db2777',
    parentId: 'p1',
    birthYear: 2018,
  },
]

export const initialScores: ScoreEntry[] = [
  // Nguyễn Bảo Hiếu — First semester
  { id: 'sc1', studentId: 's1', subject: 'Math', score: 8, date: '2025-10-05', semester: 'first' },
  { id: 'sc4', studentId: 's1', subject: 'Science', score: 7, date: '2025-10-20', semester: 'first' },
  { id: 'sc6', studentId: 's1', subject: 'English', score: 6, date: '2025-11-18', semester: 'first' },
  { id: 'sc13', studentId: 's1', subject: 'History', score: 8, date: '2025-11-03', semester: 'first' },
  // Nguyễn Bảo Hiếu — Second semester
  { id: 'sc2', studentId: 's1', subject: 'Math', score: 9, date: '2026-04-10', semester: 'second' },
  { id: 'sc3', studentId: 's1', subject: 'Math', score: 9, date: '2026-05-14', semester: 'second' },
  { id: 'sc5', studentId: 's1', subject: 'Science', score: 8, date: '2026-05-02', semester: 'second' },
  { id: 'sc7', studentId: 's1', subject: 'English', score: 9, date: '2026-06-01', semester: 'second' },
  { id: 'sc14', studentId: 's1', subject: 'History', score: 9, date: '2026-06-05', semester: 'second' },
  { id: 'sc15', studentId: 's1', subject: 'Physical Education', score: 10, date: '2026-05-09', semester: 'second' },

  // Nguyễn Thị Bảo Hân — First semester
  { id: 'sc8', studentId: 's2', subject: 'Math', score: 9, date: '2025-10-08', semester: 'first' },
  { id: 'sc10', studentId: 's2', subject: 'Reading', score: 8, date: '2025-11-22', semester: 'first' },
  { id: 'sc19', studentId: 's2', subject: 'Science', score: 9, date: '2025-11-09', semester: 'first' },
  { id: 'sc16', studentId: 's2', subject: 'Writing', score: 5, date: '2025-10-14', semester: 'first' },
  // Nguyễn Thị Bảo Hân — Second semester
  { id: 'sc9', studentId: 's2', subject: 'Math', score: 10, date: '2026-05-11', semester: 'second' },
  { id: 'sc11', studentId: 's2', subject: 'Reading', score: 9, date: '2026-05-16', semester: 'second' },
  { id: 'sc12', studentId: 's2', subject: 'Art', score: 10, date: '2026-04-27', semester: 'second' },
  { id: 'sc17', studentId: 's2', subject: 'Writing', score: 9, date: '2026-06-02', semester: 'second' },
  { id: 'sc18', studentId: 's2', subject: 'Music', score: 10, date: '2026-05-20', semester: 'second' },
]

export const initialRewards: Reward[] = [
  { id: 'r1', name: 'New football', icon: '⚽', claimed: true, cost: 50, category: 'Toys' },
  { id: 'r2', name: 'Movie night', icon: '🎬', claimed: false, cost: 30, category: 'Experiences' },
  { id: 'r3', name: 'Trip to the zoo', icon: '🦁', claimed: false, cost: 80, category: 'Experiences' },
  { id: 'r4', name: 'Painting set', icon: '🎨', claimed: true, cost: 40, category: 'Toys' },
  { id: 'r5', name: 'Ice cream treat', icon: '🍦', claimed: false, cost: 15, category: 'Treats' },
  { id: 'r6', name: 'New book', icon: '📚', claimed: false, cost: 25, category: 'Learning' },
  { id: 'r7', name: 'Extra screen time', icon: '🎮', claimed: false, cost: 20, category: 'Privileges' },
]

export const initialGoals: Goal[] = [
  {
    id: 'g1',
    studentId: 's1',
    title: 'Score 9+ in Math',
    rewardId: 'r1',
    done: true,
    subject: 'Math',
    targetScore: 9,
    points: 50,
  },
  {
    id: 'g2',
    studentId: 's1',
    title: 'Finish science project',
    rewardId: 'r2',
    done: false,
    subject: 'Science',
    points: 30,
  },
  {
    id: 'g5',
    studentId: 's1',
    title: 'Score 8+ in English',
    rewardId: 'r6',
    done: true,
    subject: 'English',
    targetScore: 8,
    points: 25,
  },
  {
    id: 'g6',
    studentId: 's1',
    title: 'Improve History to 8+',
    rewardId: 'r7',
    done: true,
    subject: 'History',
    targetScore: 8,
    points: 20,
  },
  {
    id: 'g3',
    studentId: 's2',
    title: 'Read 5 books this month',
    rewardId: 'r3',
    done: false,
    subject: 'Reading',
    points: 80,
  },
  {
    id: 'g4',
    studentId: 's2',
    title: 'Score 9+ in Art',
    rewardId: 'r4',
    done: true,
    subject: 'Art',
    targetScore: 9,
    points: 40,
  },
  {
    id: 'g7',
    studentId: 's2',
    title: 'Score 9+ in Writing',
    rewardId: 'r5',
    done: true,
    subject: 'Writing',
    targetScore: 9,
    points: 15,
  },
  {
    id: 'g8',
    studentId: 's2',
    title: 'Practice music daily',
    rewardId: 'r7',
    done: false,
    subject: 'Music',
    points: 20,
  },
]
