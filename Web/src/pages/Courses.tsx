import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { COURSES, GRADE_GROUPS } from '../data/courses'
import SubjectLogo from '../components/SubjectLogo'

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams()
  const gradeParam = searchParams.get('grade')
  const subjectParam = searchParams.get('subject')

  const selectedGrade = gradeParam ? Number(gradeParam) : null
  const selectedSubject = subjectParam ?? null

  const filtered = useMemo(() => {
    return COURSES.filter((c) => {
      if (selectedGrade !== null && c.grade !== selectedGrade) return false
      if (selectedSubject !== null && c.name !== selectedSubject) return false
      return true
    })
  }, [selectedGrade, selectedSubject])

  function selectGrade(grade: number | null) {
    const next = new URLSearchParams()
    if (grade !== null) next.set('grade', String(grade))
    setSearchParams(next)
  }

  function selectSubject(grade: number, subject: string) {
    setSearchParams({ grade: String(grade), subject })
  }

  const activeGroup = GRADE_GROUPS.find((g) => g.grade === selectedGrade)

  return (
    <div className="page">
      <section className="courses-intro">
        <h1>Our Courses</h1>
        <p className="muted">
          Choose a grade level, then pick a subject to start learning.
        </p>

        <div className="course-cats">
          <button
            className={selectedGrade === null ? 'course-cat active' : 'course-cat'}
            onClick={() => selectGrade(null)}
          >
            All Grades
          </button>
          {GRADE_GROUPS.map((group) => (
            <button
              key={group.grade}
              className={selectedGrade === group.grade ? 'course-cat active' : 'course-cat'}
              onClick={() => selectGrade(group.grade)}
            >
              {group.label}
            </button>
          ))}
        </div>

        {activeGroup && (
          <div className="course-subcats">
            <button
              className={selectedSubject === null ? 'course-subcat active' : 'course-subcat'}
              onClick={() => selectGrade(activeGroup.grade)}
            >
              All Subjects
            </button>
            {activeGroup.subjects.map((subject) => (
              <button
                key={subject.name}
                className={selectedSubject === subject.name ? 'course-subcat active' : 'course-subcat'}
                onClick={() => selectSubject(activeGroup.grade, subject.name)}
              >
                <SubjectLogo subject={subject.name} color={subject.color} size={22} /> {subject.name}
              </button>
            ))}
          </div>
        )}
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
              <SubjectLogo subject={c.name} color={c.color} size={104} />
            </div>

            <div className="course-body">
              <div className="course-tags">
                <span className="course-tag">{c.gradeLabel}</span>
                <span className="course-tag">{c.name}</span>
              </div>
              <h3>{c.name}</h3>
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
                <SubjectLogo subject={c.name} color={c.color} size={22} /> Take Exam Test
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
