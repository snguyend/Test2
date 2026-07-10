import { useMemo, useState } from 'react'

interface Course {
  id: string
  title: string
  category: string
  description: string
  age: string
  time: string
  capacity: string
  price: number
  icon: string
  color: string
}

const CATEGORIES = ['All Courses', 'Math', 'Science', 'English', 'Reading', 'Art', 'Music']

const COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Fun with Numbers',
    category: 'Math',
    description: 'Playful lessons that build counting, addition, and problem-solving confidence.',
    age: '5-8 Years',
    time: '8-10 AM',
    capacity: '30 Kids',
    price: 60,
    icon: '➗',
    color: '#2563eb',
  },
  {
    id: 'c2',
    title: 'Little Scientists',
    category: 'Science',
    description: 'Hands-on experiments that spark curiosity about the world around us.',
    age: '6-10 Years',
    time: '9-11 AM',
    capacity: '25 Kids',
    price: 65,
    icon: '🔬',
    color: '#16a34a',
  },
  {
    id: 'c3',
    title: 'English Explorers',
    category: 'English',
    description: 'Games, songs, and stories that grow vocabulary and speaking skills.',
    age: '5-9 Years',
    time: '1-3 PM',
    capacity: '30 Kids',
    price: 55,
    icon: '🔤',
    color: '#db2777',
  },
  {
    id: 'c4',
    title: 'Story Time Reading',
    category: 'Reading',
    description: 'Guided reading adventures that build comprehension and a love of books.',
    age: '4-8 Years',
    time: '2-4 PM',
    capacity: '20 Kids',
    price: 50,
    icon: '📖',
    color: '#ea580c',
  },
  {
    id: 'c5',
    title: 'Creative Art Studio',
    category: 'Art',
    description: 'Drawing, painting, and crafts that let young imaginations run wild.',
    age: '5-10 Years',
    time: '3-5 PM',
    capacity: '18 Kids',
    price: 45,
    icon: '🎨',
    color: '#7c3aed',
  },
  {
    id: 'c6',
    title: 'Music & Rhythm',
    category: 'Music',
    description: 'Sing, clap, and play along to discover rhythm, melody, and teamwork.',
    age: '4-9 Years',
    time: '4-6 PM',
    capacity: '22 Kids',
    price: 55,
    icon: '🎵',
    color: '#0891b2',
  },
]

export default function Courses() {
  const [category, setCategory] = useState('All Courses')

  const filtered = useMemo(
    () => (category === 'All Courses' ? COURSES : COURSES.filter((c) => c.category === category)),
    [category],
  )

  return (
    <div className="page">
      <section className="courses-intro">
        <h1>Our Courses</h1>
        <p className="muted">
          You can start learning these courses and get certified within a few days.
        </p>

        <div className="course-cats">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={cat === category ? 'course-cat active' : 'course-cat'}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <div className="course-grid">
        {filtered.map((c) => (
          <article key={c.id} className="card course-card">
            <div
              className="course-banner"
              style={{
                background: `linear-gradient(135deg, ${c.color}, color-mix(in srgb, ${c.color} 55%, #ffffff))`,
              }}
            >
              <span className="course-emoji">{c.icon}</span>
              <span className="course-price">${c.price}</span>
            </div>

            <div className="course-body">
              <span className="course-tag">{c.category}</span>
              <h3>{c.title}</h3>
              <p className="muted course-desc">{c.description}</p>

              <div className="course-meta">
                <div>
                  <span className="cm-label">Age</span>
                  <span className="cm-value">{c.age}</span>
                </div>
                <div>
                  <span className="cm-label">Time</span>
                  <span className="cm-value">{c.time}</span>
                </div>
                <div>
                  <span className="cm-label">Capacity</span>
                  <span className="cm-value">{c.capacity}</span>
                </div>
              </div>

              <button type="button" className="btn course-btn">
                🛒 Purchase Course
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
