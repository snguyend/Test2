import type { AboutContent, BlogPost, Goal, HabitGoal, Homework, JournalEntry, GrowthSnapshot, Encouragement, Parent, Reward, ScoreEntry, Student } from '../types'

export const parents: Parent[] = [
  { id: 'p1', name: 'Nguyễn Văn An', email: 'an.nguyen@example.com' },
]

export const students: Student[] = [
  {
    id: 's1',
    name: 'Nguyễn Bảo Hiếu',
    grade: 'Preparing for Grade 8',
    avatar: '👦',
    color: '#0891b2',
    parentId: 'p1',
    birthYear: 2013,
  },
  {
    id: 's2',
    name: 'Nguyễn Thị Bảo Hân',
    grade: 'Grade 3',
    avatar: '👧',
    color: '#e11d48',
    parentId: 'p1',
    birthYear: 2018,
  },
]

export const initialScores: ScoreEntry[] = [
  // Nguyễn Bảo Hiếu — Grade 8, First semester
  { id: 'sc1', studentId: 's1', subject: 'Math', score: 8, date: '2025-10-05', semester: 'first', grade: 8 },
  { id: 'sc4', studentId: 's1', subject: 'Science', score: 7, date: '2025-10-20', semester: 'first', grade: 8 },
  { id: 'sc6', studentId: 's1', subject: 'English', score: 6, date: '2025-11-18', semester: 'first', grade: 8 },
  { id: 'sc13', studentId: 's1', subject: 'History', score: 8, date: '2025-11-03', semester: 'first', grade: 8 },
  // Nguyễn Bảo Hiếu — Grade 8, Second semester
  { id: 'sc2', studentId: 's1', subject: 'Math', score: 9, date: '2026-04-10', semester: 'second', grade: 8 },
  { id: 'sc3', studentId: 's1', subject: 'Math', score: 9, date: '2026-05-14', semester: 'second', grade: 8 },
  { id: 'sc5', studentId: 's1', subject: 'Science', score: 8, date: '2026-05-02', semester: 'second', grade: 8 },
  { id: 'sc7', studentId: 's1', subject: 'English', score: 9, date: '2026-06-01', semester: 'second', grade: 8 },
  { id: 'sc14', studentId: 's1', subject: 'History', score: 9, date: '2026-06-05', semester: 'second', grade: 8 },
  { id: 'sc15', studentId: 's1', subject: 'Physical Education', score: 10, date: '2026-05-09', semester: 'second', grade: 8 },

  // Nguyễn Thị Bảo Hân — Grade 3, First semester
  { id: 'sc8', studentId: 's2', subject: 'Math', score: 9, date: '2025-10-08', semester: 'first', grade: 3 },
  { id: 'sc10', studentId: 's2', subject: 'Reading', score: 8, date: '2025-11-22', semester: 'first', grade: 3 },
  { id: 'sc19', studentId: 's2', subject: 'Science', score: 9, date: '2025-11-09', semester: 'first', grade: 3 },
  { id: 'sc16', studentId: 's2', subject: 'Writing', score: 5, date: '2025-10-14', semester: 'first', grade: 3 },
  // Nguyễn Thị Bảo Hân — Grade 3, Second semester
  { id: 'sc9', studentId: 's2', subject: 'Math', score: 10, date: '2026-05-11', semester: 'second', grade: 3 },
  { id: 'sc11', studentId: 's2', subject: 'Reading', score: 9, date: '2026-05-16', semester: 'second', grade: 3 },
  { id: 'sc12', studentId: 's2', subject: 'Art', score: 10, date: '2026-04-27', semester: 'second', grade: 3 },
  { id: 'sc17', studentId: 's2', subject: 'Writing', score: 9, date: '2026-06-02', semester: 'second', grade: 3 },
  { id: 'sc18', studentId: 's2', subject: 'Music', score: 10, date: '2026-05-20', semester: 'second', grade: 3 },
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

/** Suggested habit units — families can also type a custom one. */
export const HABIT_UNITS = ['minutes', 'sessions', 'pages', 'tasks']

export const initialHabitGoals: HabitGoal[] = [  // Nguyễn Bảo Hiếu
  { id: 'h1', studentId: 's1', activity: 'Reading', icon: '📖', unit: 'minutes', weeklyTarget: 150, weeklyProgress: 120 },
  { id: 'h2', studentId: 's1', activity: 'Coding', icon: '💻', unit: 'minutes', weeklyTarget: 120, weeklyProgress: 120 },
  { id: 'h3', studentId: 's1', activity: 'Swimming', icon: '🏊', unit: 'sessions', weeklyTarget: 2, weeklyProgress: 1 },
  // Nguyễn Thị Bảo Hân
  { id: 'h4', studentId: 's2', activity: 'Reading', icon: '📖', unit: 'minutes', weeklyTarget: 100, weeklyProgress: 100 },
  { id: 'h5', studentId: 's2', activity: 'English', icon: '🔤', unit: 'minutes', weeklyTarget: 80, weeklyProgress: 55 },
]

export const initialHomework: Homework[] = [
  { id: 'hw1', studentId: 's1', title: 'Math worksheet p.10', subject: 'Math', description: 'Complete exercises 1–15 on page 10.', dueDate: '2026-07-24', done: false },
  { id: 'hw2', studentId: 's1', title: 'Science reading', subject: 'Science', description: 'Read chapter 3 and write a short summary.', dueDate: '2026-07-22', done: true },
  { id: 'hw3', studentId: 's2', title: 'Reading log', subject: 'Reading', description: 'Read for 20 minutes and note the story.', dueDate: '2026-07-23', done: false },
]

export const initialBlogPosts: BlogPost[] = [
  { id: 'b1', title: 'The Gentle Power of Predictable Days: Building Routines', excerpt: 'A steady daily rhythm gives children a sense of safety and helps learning stick. Here is how to build routines that feel calm, not rigid.', date: 'Mar 4', readMins: 7, emoji: '🌅', color: '#f59e0b', tag: 'Routines' },
  { id: 'b2', title: "Understanding Your Child's Misbehavior: The Hidden Needs", excerpt: 'Behavior is communication. When we look past the surface, most “misbehavior” is really an unmet need asking to be seen.', date: 'Feb 12', readMins: 9, emoji: '💛', color: '#0891b2', tag: 'Emotions' },
  { id: 'b3', title: 'How Digital Parenting Education Transforms Families', excerpt: 'Tracking growth, celebrating wins, and reflecting together — small digital habits can bring a family closer around learning.', date: 'Jan 23', readMins: 4, emoji: '📈', color: '#22c55e', tag: 'Growth' },
  { id: 'b4', title: 'Turning Homework Battles into Calm Focus Time', excerpt: 'A few simple shifts — clear expectations, short breaks, and encouragement — can turn homework struggles into steady progress.', date: 'Jan 8', readMins: 6, emoji: '📝', color: '#6366f1', tag: 'Homework' },
  { id: 'b5', title: 'Praise the Effort, Not Just the Score', excerpt: 'Growth mindset starts at home. Learn how the words we choose shape a child’s confidence and love of learning.', date: 'Dec 15', readMins: 5, emoji: '🌱', color: '#e11d48', tag: 'Mindset' },
  { id: 'b6', title: 'Reading Together: The Habit That Lifts Every Subject', excerpt: 'Twenty minutes of shared reading a day builds vocabulary, focus, and connection. Here are ideas to make it a favourite ritual.', date: 'Dec 1', readMins: 8, emoji: '📚', color: '#8b5cf6', tag: 'Reading' },
]

/** Default (editable) prose for the About page. */
export const defaultAboutContent: AboutContent = {
  heroTitle: 'Growing Parents. Growing Families.',
  heroBody:
    "Family Growth exists to give families the resources to grow and thrive in today's busy world — a continuous development approach we call The Launch Trajectory. Designed for the parent–child journey from birth through adulthood, it blends evidence-based methods, actionable practices, and community. When parents and children grow together, transformation isn't just possible — it's inevitable.",
  vision:
    'A world where every family has access to continuous growth and support — where parenting is recognized not as a role to perfect, but as a transformative journey that shapes both children and parents into their fullest potential.',
  mission:
    "We empower parents to grow with their children through structured programs, research-backed methods, and a community of ongoing development — because parenting is not just about raising children, it's about becoming who we're meant to be, together.",
  why:
    "Parenting today can feel overwhelming. The advice is endless, the opinions are loud, and the guidance often stops at short-term behavior fixes. Parents are left wondering — am I doing this right?\n\nWe believe the real question isn't just \u201chow do I raise my child?\u201d — it's \u201chow do we grow together?\u201d That's why we created a structured growth path designed specifically for the parent–child co-evolution journey.",
  who:
    "We work with parents who value intentional growth — curious, purpose-driven moms and dads in their first decade of parenting who want to raise kind, confident, resilient children while continuing to evolve themselves.\n\nOur community is built for those who believe:\n- Parenting is a leadership journey.\n- Growth doesn't stop when you have kids — it deepens.\n- Structure and science can create more peace, connection, and confidence at home.",
  how:
    'We guide parents through proven methods like Positive Discipline, Growth Mindset, and Learned Optimism, integrated into practical, family-tested programs.\n\nOur approach combines:\n- Evidence-based frameworks that build lasting skills.\n- Hands-on tools you can apply daily.\n- A supportive community of parents walking the same path.\n\nTogether, we help families turn everyday challenges into opportunities for growth — so both parent and child can thrive.',
  outcome:
    "When parents grow, families transform. With Family Growth, you'll experience:\n- Deeper connection and communication within your family.\n- Confidence rooted in clarity, not comparison.\n- Children who feel seen, supported, and capable.\n- A home culture grounded in growth, empathy, and optimism.\n\nParenting becomes more than survival — it becomes transformation. Growth becomes the family culture.",
}

export const initialJournal: JournalEntry[] = [
  {
    id: 'j1',
    studentId: 's1',
    date: '2026-06-01',
    wentWell: ['Self-motivated learning', 'Completed homework on time'],
    toImprove: ['Needs more focus during English'],
    nextGoals: ['Read for 120 minutes', 'Practice sports 3 times'],
    parentReflection: "I'm so proud you've kept up your reading consistently. Keep it going! ❤️",
  },
  {
    id: 'j2',
    studentId: 's1',
    date: '2026-05-18',
    wentWell: ['Great effort in the science project'],
    toImprove: ['Manage time better on weekends'],
    nextGoals: ['Finish English reading assignment'],
    parentReflection: 'Steady improvement week over week. Very encouraging.',
  },
  {
    id: 'j3',
    studentId: 's2',
    date: '2026-05-20',
    wentWell: ['Loves art class', 'Very consistent reading habit'],
    toImprove: ['Practice writing more'],
    nextGoals: ['Read 100 minutes', 'Practice piano daily'],
    parentReflection: 'Perfect score in art — such creativity! Keep shining. 🌟',
  },
]

/** Build 12 weekly snapshots trending upward to `endScore`, ending last week. */
function seedGrowthHistory(studentId: string, endScore: number): GrowthSnapshot[] {
  const weeks = 12
  const monday = new Date()
  const dow = (monday.getDay() + 6) % 7
  monday.setDate(monday.getDate() - dow) // this week's Monday
  const iso = (d: Date) => {
    const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    return tz.toISOString().slice(0, 10)
  }
  return Array.from({ length: weeks }, (_, i) => {
    const stepsFromEnd = weeks - 1 - i // 11 .. 0
    const d = new Date(monday)
    d.setDate(monday.getDate() - stepsFromEnd * 7)
    const score = Math.round((endScore - stepsFromEnd * 0.08) * 100) / 100
    return { studentId, date: iso(d), score: Math.max(0, score) }
  })
}

export const initialGrowthHistory: GrowthSnapshot[] = [
  ...seedGrowthHistory('s1', 8.6),
  ...seedGrowthHistory('s2', 8.8),
]

export const initialEncouragements: Encouragement[] = [
  {
    id: 'e1',
    studentId: 's1',
    from: 'Grandma',
    message: "I'm so proud you've kept up your reading this week ❤️",
    date: '2026-07-12',
  },
  {
    id: 'e2',
    studentId: 's1',
    from: 'Dad',
    message: "You're making great progress — keep it up! 🚀",
    date: '2026-07-10',
  },
  {
    id: 'e3',
    studentId: 's2',
    from: 'Mom',
    message: 'Your art is beautiful and your reading is so consistent. Well done! 🌟',
    date: '2026-07-11',
  },
]

