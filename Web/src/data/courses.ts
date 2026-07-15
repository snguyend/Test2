export interface Subject {
  name: string
  icon: string
  color: string
  description: string
}

export interface GradeGroup {
  grade: number
  label: string
  subjects: Subject[]
}

export interface Course extends Subject {
  id: string
  grade: number
  gradeLabel: string
  age: string
  time: string
  capacity: string
  price: number
}

const SUBJECT_META: Record<string, { icon: string; color: string; description: string }> = {
  Math: { icon: '➗', color: '#2563eb', description: 'Build counting, arithmetic, and problem-solving confidence.' },
  Vietnamese: { icon: '🇻🇳', color: '#ef4444', description: 'Grow reading, writing, and speaking skills in Vietnamese.' },
  Science: { icon: '🔬', color: '#16a34a', description: 'Hands-on experiments that spark curiosity about the world.' },
  English: { icon: '🔤', color: '#db2777', description: 'Games, songs, and stories that grow vocabulary and fluency.' },
  Reading: { icon: '📖', color: '#ea580c', description: 'Guided reading adventures that build comprehension.' },
  Music: { icon: '🎵', color: '#0891b2', description: 'Discover rhythm, melody, and teamwork through play.' },
  Physics: { icon: '⚛️', color: '#7c3aed', description: 'Explore motion, forces, and energy with real experiments.' },
  Chemistry: { icon: '🧪', color: '#0d9488', description: 'Investigate matter, reactions, and the periodic table.' },
  Biology: { icon: '🧬', color: '#22c55e', description: 'Study living things, cells, and how life works.' },
  Geology: { icon: '🌋', color: '#b45309', description: 'Understand rocks, minerals, and the shifting Earth.' },
  Astronomy: { icon: '🔭', color: '#6366f1', description: 'Journey through planets, stars, and the universe.' },
}

const GRADE_SUBJECTS: Record<number, string[]> = {
  3: ['Math', 'Vietnamese', 'Science', 'English', 'Reading', 'Music'],
  8: ['Math', 'Science', 'English', 'Physics', 'Chemistry', 'Biology', 'Geology', 'Astronomy'],
}

const GRADE_DEFAULTS: Record<number, { age: string; time: string; capacity: string; price: number }> = {
  3: { age: '8-9 Years', time: '8-10 AM', capacity: '30 Kids', price: 55 },
  8: { age: '13-14 Years', time: '1-3 PM', capacity: '28 Kids', price: 75 },
}

function buildSubject(name: string): Subject {
  const meta = SUBJECT_META[name]
  return { name, ...meta }
}

/** Returns the theme color for a subject, with a neutral fallback for unknown ones. */
export function subjectColor(name: string): string {
  return SUBJECT_META[name]?.color ?? '#64748b'
}

export const GRADE_GROUPS: GradeGroup[] = Object.entries(GRADE_SUBJECTS).map(([grade, subjects]) => ({
  grade: Number(grade),
  label: `Grade ${grade}`,
  subjects: subjects.map(buildSubject),
}))

export const COURSES: Course[] = GRADE_GROUPS.flatMap((group) =>
  group.subjects.map((subject) => {
    const defaults = GRADE_DEFAULTS[group.grade]
    return {
      id: `g${group.grade}-${subject.name.toLowerCase()}`,
      grade: group.grade,
      gradeLabel: group.label,
      ...subject,
      ...defaults,
    }
  }),
)
