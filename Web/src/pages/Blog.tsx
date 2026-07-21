import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { NavLink } from 'react-router-dom'
import { useAppData } from '../store-context'
import type { BlogPost } from '../types'

const EMPTY_POST: Omit<BlogPost, 'id'> = {
  title: '',
  excerpt: '',
  date: '',
  readMins: 5,
  emoji: '📝',
  color: '#6366f1',
  tag: '',
}

const COLOR_CHOICES = ['#f59e0b', '#0891b2', '#22c55e', '#6366f1', '#e11d48', '#8b5cf6', '#0ea5e9']
const EMOJI_CHOICES = ['📝', '🌅', '💛', '📈', '🌱', '📚', '🎨', '🧮', '⭐', '❤️', '🚀', '🧠']

/** Inline add/edit form for a single blog article. */
function BlogEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<BlogPost, 'id'>
  onSave: (value: Omit<BlogPost, 'id'>) => void
  onCancel: () => void
}) {
  const { uploadBlogPhoto } = useAppData()
  const [draft, setDraft] = useState<Omit<BlogPost, 'id'>>(initial)

  function set<K extends keyof Omit<BlogPost, 'id'>>(key: K, value: Omit<BlogPost, 'id'>[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      try {
        const url = await uploadBlogPhoto(dataUrl)
        setDraft((d) => ({ ...d, imageUrl: url }))
      } catch (err) {
        console.error('[blog] photo upload failed', err)
        setDraft((d) => ({ ...d, imageUrl: dataUrl }))
      }
    }
    reader.readAsDataURL(file)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!draft.title.trim()) return
    onSave({
      ...draft,
      title: draft.title.trim(),
      excerpt: draft.excerpt.trim(),
      tag: draft.tag.trim(),
    })
  }

  return (
    <form
      className="card"
      onSubmit={submit}
      style={{ display: 'grid', gap: 12, border: `2px solid ${draft.color}` }}
    >
      <div style={{ display: 'grid', gap: 6 }}>
        <span className="muted" style={{ fontSize: 13 }}>Banner photo (optional)</span>
        {draft.imageUrl ? (
          <img
            src={draft.imageUrl}
            alt="Banner preview"
            style={{
              width: '100%',
              maxWidth: 260,
              aspectRatio: '16 / 9',
              objectFit: 'cover',
              borderRadius: 10,
              display: 'block',
            }}
          />
        ) : (
          <span className="muted" style={{ fontSize: 13 }}>
            No photo — the coloured icon banner is used.
          </span>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label className="btn" style={{ cursor: 'pointer' }}>
            📷 {draft.imageUrl ? 'Change photo' : 'Add photo'}
            <input type="file" accept="image/*" hidden onChange={handlePhoto} />
          </label>
          {draft.imageUrl && (
            <button
              type="button"
              className="btn"
              style={{ background: '#e5e7eb', color: '#111827' }}
              onClick={() => set('imageUrl', undefined)}
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}
      >
        <label style={{ display: 'grid', gap: 4 }}>
          <span className="muted" style={{ fontSize: 13 }}>Title *</span>
          <input value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="Article title" required />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span className="muted" style={{ fontSize: 13 }}>Tag</span>
          <input value={draft.tag} onChange={(e) => set('tag', e.target.value)} placeholder="e.g. Routines" />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span className="muted" style={{ fontSize: 13 }}>Date label</span>
          <input value={draft.date} onChange={(e) => set('date', e.target.value)} placeholder="e.g. Mar 4" />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span className="muted" style={{ fontSize: 13 }}>Read minutes</span>
          <input
            type="number"
            min={1}
            value={draft.readMins}
            onChange={(e) => set('readMins', Number(e.target.value) || 1)}
          />
        </label>
      </div>

      <label style={{ display: 'grid', gap: 4 }}>
        <span className="muted" style={{ fontSize: 13 }}>Excerpt</span>
        <textarea
          value={draft.excerpt}
          onChange={(e) => set('excerpt', e.target.value)}
          placeholder="Short summary shown on the card"
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </label>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="muted" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Icon</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {EMOJI_CHOICES.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => set('emoji', em)}
                style={{
                  fontSize: 18,
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: draft.emoji === em ? `2px solid ${draft.color}` : '1px solid #e5e7eb',
                  background: '#fff',
                }}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="muted" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Colour</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {COLOR_CHOICES.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Colour ${c}`}
                onClick={() => set('color', c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  background: c,
                  border: draft.color === c ? '3px solid #111827' : '2px solid #fff',
                  boxShadow: '0 0 0 1px #e5e7eb',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn">Save</button>
        <button
          type="button"
          className="btn"
          style={{ background: '#e5e7eb', color: '#111827' }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function Blog() {
  const { blogPosts, addBlogPost, updateBlogPost, deleteBlogPost } = useAppData()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div className="page">
      <section style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>Family Growth Blog</h1>
        <p className="muted" style={{ maxWidth: 620, margin: '0 auto' }}>
          Ideas, encouragement, and practical tips for nurturing your children&apos;s learning
          journey.
        </p>
      </section>

      {blogPosts.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center' }}>
          No articles yet. Use <strong>Add a new article</strong> below to write your first one.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          {blogPosts.map((a) =>
            editingId === a.id ? (
              <BlogEditor
                key={a.id}
                initial={a}
                onSave={(value) => {
                  updateBlogPost(a.id, value)
                  setEditingId(null)
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <article
                key={a.id}
                className="card"
                style={{ overflow: 'hidden', padding: 0, position: 'relative' }}
              >
                {/* Edit / delete controls */}
                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(a.id)
                      setAdding(false)
                    }}
                    title="Edit article"
                    aria-label={`Edit ${a.title}`}
                    style={{
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      background: 'rgba(255,255,255,0.9)',
                      fontSize: 14,
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${a.title}"?`)) deleteBlogPost(a.id)
                    }}
                    title="Delete article"
                    aria-label={`Delete ${a.title}`}
                    style={{
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      background: 'rgba(255,255,255,0.9)',
                      fontSize: 14,
                    }}
                  >
                    🗑
                  </button>
                </div>

                {a.imageUrl ? (
                  <img
                    src={a.imageUrl}
                    alt={a.title}
                    style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div
                    style={{
                      height: 160,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 56,
                      background: `linear-gradient(135deg, ${a.color}, color-mix(in srgb, ${a.color} 45%, #ffffff))`,
                    }}
                    aria-hidden
                  >
                    {a.emoji}
                  </div>
                )}

                <div style={{ padding: '16px 18px 20px' }}>
                  <div
                    className="muted"
                    style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {a.date && <span>{a.date}</span>}
                    {a.date && <span aria-hidden>·</span>}
                    <span>{a.readMins} min read</span>
                    {a.tag && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 11,
                          fontWeight: 700,
                          color: a.color,
                          background: `color-mix(in srgb, ${a.color} 14%, #ffffff)`,
                          borderRadius: 999,
                          padding: '2px 10px',
                        }}
                      >
                        {a.tag}
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: '10px 0 8px', lineHeight: 1.3 }}>{a.title}</h3>
                  <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
                    {a.excerpt}
                  </p>
                </div>
              </article>
            ),
          )}
        </div>
      )}

      {/* New design kept at the bottom: write / add a new article */}
      <section className="card" style={{ marginTop: 28 }}>
        <h3 style={{ marginTop: 0 }}>✍️ Add a new article</h3>
        {adding ? (
          <BlogEditor
            initial={EMPTY_POST}
            onSave={(value) => {
              addBlogPost(value)
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <>
            <p className="muted" style={{ margin: '0 0 14px' }}>
              Write a new post — it appears in the grid above and is shared with your family.
            </p>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setAdding(true)
                setEditingId(null)
              }}
            >
              ➕ Add article
            </button>
          </>
        )}
      </section>

      <section style={{ marginTop: 20, textAlign: 'center' }}>
        <NavLink to="/" className="btn" style={{ background: '#e5e7eb', color: '#111827' }}>
          ← Back to Dashboard
        </NavLink>
      </section>
    </div>
  )
}
