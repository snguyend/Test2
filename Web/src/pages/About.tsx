import { useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import CollapsibleSection from '../components/CollapsibleSection'
import { useAppData } from '../store-context'
import type { AboutContent } from '../types'

/** Render editable multiline text: blank lines split paragraphs, "- " lines become bullets. */
function renderRich(text: string): ReactNode {
  const blocks: ReactNode[] = []
  let bullets: string[] = []
  let key = 0
  const flush = () => {
    if (bullets.length) {
      const items = bullets
      blocks.push(
        <ul key={`ul-${key++}`}>
          {items.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>,
      )
      bullets = []
    }
  }
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) {
      flush()
      continue
    }
    if (line.startsWith('- ')) {
      bullets.push(line.slice(2))
      continue
    }
    flush()
    blocks.push(<p key={`p-${key++}`}>{line}</p>)
  }
  flush()
  return blocks
}

/** Original family + growth illustration for the hero (self-contained SVG). */
function FamilyIllustration() {
  return (
    <svg
      viewBox="0 0 360 220"
      width="100%"
      style={{ maxWidth: 360 }}
      role="img"
      aria-label="A growing family"
    >
      <rect x="0" y="0" width="360" height="220" rx="24" fill="#fef9f0" />
      <g fill="#cbd5e1">
        <circle cx="40" cy="34" r="3" />
        <circle cx="322" cy="40" r="3" />
        <circle cx="300" cy="150" r="3" />
      </g>
      {/* parent (left) */}
      <g>
        <circle cx="86" cy="84" r="26" fill="#f4c58c" />
        <path d="M60 84a26 26 0 0 1 52 0z" fill="#1f3a5f" />
        <rect x="58" y="112" width="56" height="86" rx="20" fill="#ef6a5a" />
      </g>
      {/* child (middle) */}
      <g>
        <circle cx="180" cy="104" r="20" fill="#f4c58c" />
        <path d="M160 104a20 20 0 0 1 40 0z" fill="#1f3a5f" />
        <rect x="156" y="126" width="48" height="72" rx="16" fill="#f59e0b" />
      </g>
      {/* parent (right) */}
      <g>
        <circle cx="274" cy="84" r="26" fill="#f4c58c" />
        <path d="M248 84a26 26 0 0 1 52 0z" fill="#1f3a5f" />
        <rect x="246" y="112" width="56" height="86" rx="20" fill="#14b8a6" />
      </g>
      {/* growth board */}
      <g>
        <rect x="120" y="150" width="120" height="58" rx="10" fill="#ffffff" stroke="#e5e7eb" />
        <polyline
          points="132,192 156,178 180,184 204,160 228,166"
          fill="none"
          stroke="#22c55e"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="228" cy="166" r="4" fill="#22c55e" />
      </g>
    </svg>
  )
}

/** The Launch Trajectory life stages. */
const LAUNCH_STAGES = [
  { name: 'Foundation', ages: '0–6', focus: 'Security & Exploration', role: 'Builder', color: '#22c55e' },
  { name: 'Formation', ages: '7–12', focus: 'Competence & Character', role: 'Coach', color: '#f59e0b' },
  { name: 'Ignition', ages: '13–18', focus: 'Identity & Agency', role: 'Guide', color: '#f97316' },
]

/** The six “Launch Systems” that support healthy growth. */
const LAUNCH_SYSTEMS = [
  { icon: '❤️', name: 'The Base', desc: 'A foundation of trust and belonging that makes growth possible.', color: '#ef4444' },
  { icon: '⚡', name: 'The Engine', desc: 'Intrinsic motivation and curiosity that fuels lifelong learning.', color: '#f59e0b' },
  { icon: '🛡️', name: 'The Shield', desc: 'The ability to bounce back from setbacks and learn from failure.', color: '#22c55e' },
  { icon: '🧭', name: 'The Navigation', desc: 'Critical thinking and decision-making skills for complex choices.', color: '#f97316' },
  { icon: '🏰', name: 'The Structure', desc: 'Integrity, responsibility, and values that guide behavior.', color: '#334155' },
  { icon: '⭐', name: 'The Mission', desc: 'A sense of purpose and the drive to make a meaningful impact.', color: '#8b5cf6' },
]

export default function About() {
  const { aboutContent, updateAboutContent, uploadAboutPhoto, remote } = useAppData()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<AboutContent>(aboutContent)

  const startEdit = () => {
    setDraft(aboutContent)
    setEditing(true)
  }
  const save = () => {
    updateAboutContent(draft)
    setEditing(false)
  }
  const setField = (k: keyof AboutContent, v: string) =>
    setDraft((d) => ({ ...d, [k]: v }))

  const setPos = (x: number, y: number) =>
    setDraft((d) => ({ ...d, heroImagePosition: `${x}% ${y}%` }))

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      try {
        const url = await uploadAboutPhoto(dataUrl)
        setDraft((d) => ({ ...d, heroImageUrl: url }))
      } catch (err) {
        console.error('[about] photo upload failed', err)
        setDraft((d) => ({ ...d, heroImageUrl: dataUrl }))
      }
    }
    reader.readAsDataURL(file)
  }

  if (editing) {
    const longFields: [keyof AboutContent, string][] = [
      ['heroBody', 'Hero intro'],
      ['vision', 'Our Vision'],
      ['mission', 'Our Mission'],
      ['why', 'Why We Exist'],
      ['who', 'Who We Serve'],
      ['how', 'How We Help'],
      ['outcome', 'The Outcome'],
    ]
    const posParts = (draft.heroImagePosition ?? '50% 50%').split(' ')
    const px = Number.parseInt(posParts[0] ?? '', 10) || 50
    const py = Number.parseInt(posParts[1] ?? '', 10) || 50
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <h1 style={{ margin: 0 }}>Edit About page</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button type="button" className="btn" onClick={save}>
              Save
            </button>
            <button
              type="button"
              className="btn"
              style={{ background: '#e5e7eb', color: '#111827' }}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </div>
        {!remote && (
          <p className="muted" style={{ marginTop: 0 }}>
            Changes save on this device. Run <code>supabase/about.sql</code> to share edits with the
            whole family.
          </p>
        )}
        <div className="card" style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="muted" style={{ fontSize: 13 }}>Hero picture</span>
            {draft.heroImageUrl ? (
              <>
                <img
                  src={draft.heroImageUrl}
                  alt="Hero preview"
                  style={{
                    width: 260,
                    aspectRatio: '16 / 11',
                    objectFit: 'cover',
                    objectPosition: draft.heroImagePosition ?? 'center',
                    borderRadius: 14,
                    display: 'block',
                  }}
                />
                <div style={{ display: 'grid', gap: 6, maxWidth: 260 }}>
                  <label style={{ display: 'grid', gap: 2 }}>
                    <span className="muted" style={{ fontSize: 12 }}>Move left ↔ right</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={px}
                      onChange={(e) => setPos(Number(e.target.value), py)}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: 2 }}>
                    <span className="muted" style={{ fontSize: 12 }}>Move up ↕ down</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={py}
                      onChange={(e) => setPos(px, Number(e.target.value))}
                    />
                  </label>
                </div>
              </>
            ) : (
              <span className="muted" style={{ fontSize: 13 }}>
                No photo yet — the illustration is shown. Add your family photo below.
              </span>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <label className="btn" style={{ cursor: 'pointer' }}>
                📷 {draft.heroImageUrl ? 'Change picture' : 'Add picture'}
                <input type="file" accept="image/*" hidden onChange={handlePhoto} />
              </label>
              {draft.heroImageUrl && (
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#e5e7eb', color: '#111827' }}
                  onClick={() => setField('heroImageUrl', '')}
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
          <label style={{ display: 'grid', gap: 4 }}>
            <span className="muted" style={{ fontSize: 13 }}>Hero title</span>
            <input value={draft.heroTitle} onChange={(e) => setField('heroTitle', e.target.value)} />
          </label>
          {longFields.map(([k, label]) => (
            <label key={k} style={{ display: 'grid', gap: 4 }}>
              <span className="muted" style={{ fontSize: 13 }}>{label}</span>
              <textarea
                value={draft[k]}
                onChange={(e) => setField(k, e.target.value)}
                rows={k === 'heroBody' || k === 'vision' || k === 'mission' ? 4 : 7}
                style={{ resize: 'vertical' }}
              />
            </label>
          ))}
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Tip: leave a blank line between paragraphs. Start a line with “- ” to make a bullet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button type="button" className="btn" onClick={startEdit}>
          ✏️ Edit page
        </button>
      </div>

      {/* ===== Hero ===== */}
      <section
        className="card"
        style={{
          padding: 28,
          background: 'linear-gradient(135deg, #ecfdf5, #eff6ff)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <div>
          {aboutContent.heroImageUrl ? (
            <img
              src={aboutContent.heroImageUrl}
              alt="Our family"
              style={{
                width: '100%',
                maxWidth: 360,
                aspectRatio: '16 / 11',
                objectFit: 'cover',
                objectPosition: aboutContent.heroImagePosition ?? 'center',
                borderRadius: 20,
                display: 'block',
              }}
            />
          ) : (
            <FamilyIllustration />
          )}
        </div>
        <div>
          <h1 style={{ margin: '0 0 12px' }}>{aboutContent.heroTitle}</h1>
          <p className="muted" style={{ margin: 0, lineHeight: 1.7, fontSize: 16 }}>
            {aboutContent.heroBody}
          </p>
        </div>
      </section>

      {/* ===== The Launch Trajectory ===== */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 4 }}>
          Our Unique System — The Launch Trajectory
        </h2>
        <p className="muted" style={{ textAlign: 'center', margin: '0 auto 16px', maxWidth: 620 }}>
          A guided path across three life stages, ending in a confident, independent young adult.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {LAUNCH_STAGES.map((s) => (
            <div key={s.name} className="card" style={{ borderTop: `4px solid ${s.color}` }}>
              <h3 style={{ margin: '0 0 4px' }}>
                {s.name}{' '}
                <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>({s.ages})</span>
              </h3>
              <p className="muted" style={{ margin: '0 0 10px' }}>{s.focus}</p>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: s.color,
                  background: `color-mix(in srgb, ${s.color} 14%, #ffffff)`,
                  borderRadius: 999,
                  padding: '3px 10px',
                }}
              >
                Parent&apos;s role: {s.role}
              </span>
            </div>
          ))}
          <div
            className="card"
            style={{
              borderTop: '4px solid #64748b',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 30 }} aria-hidden>🚀</div>
            <h3 style={{ margin: '4px 0' }}>Launch Goal</h3>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              A confident, capable, self-reliant young adult ready for successful independence.
            </p>
          </div>
        </div>

        <h3 style={{ textAlign: 'center', marginTop: 24 }}>The Six Launch Systems</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
            marginTop: 12,
          }}
        >
          {LAUNCH_SYSTEMS.map((s) => (
            <div key={s.name} className="card" style={{ borderLeft: `4px solid ${s.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }} aria-hidden>{s.icon}</span>
                <strong>{s.name}</strong>
              </div>
              <p className="muted" style={{ margin: '6px 0 0', fontSize: 14 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Vision & Mission ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginTop: 28,
        }}
      >
        <section className="card" style={{ background: '#ecfdf5' }}>
          <h2 style={{ marginTop: 0 }}>🌏 Our Vision</h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>{aboutContent.vision}</p>
        </section>
        <section className="card" style={{ background: '#ecfdf5' }}>
          <h2 style={{ marginTop: 0 }}>🎯 Our Mission</h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>{aboutContent.mission}</p>
        </section>
      </div>

      {/* ===== Detail sections (collapsible) ===== */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ marginBottom: 12 }}>Learn more</h2>
        <CollapsibleSection title="Why We Exist" icon="❓" color="#f59e0b" defaultOpen>
          {renderRich(aboutContent.why)}
        </CollapsibleSection>
        <CollapsibleSection title="Who We Serve" icon="👨‍👩‍👧‍👦" color="#0891b2">
          {renderRich(aboutContent.who)}
        </CollapsibleSection>
        <CollapsibleSection title="How We Help" icon="🤝" color="#16a34a">
          {renderRich(aboutContent.how)}
        </CollapsibleSection>
        <CollapsibleSection title="The Outcome" icon="🌟" color="#8b5cf6">
          {renderRich(aboutContent.outcome)}
        </CollapsibleSection>
      </section>
    </div>
  )
}
