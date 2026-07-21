import { useState } from 'react'

const CONTACT_CARDS = [
  { icon: '📞', label: 'Phone', value: '0979431362', href: 'tel:0979431362' },
  {
    icon: '✉️',
    label: 'Email',
    value: 'dinhsonnokia@outlook.com',
    href: 'mailto:dinhsonnokia@outlook.com',
  },
  {
    icon: '📍',
    label: 'Social / Address',
    value: 'Tri Qua Ward - Bac Ninh Province, Vietnam',
    href: 'https://maps.google.com/?q=Tri+Qua+Ward,+Bac+Ninh+Province,+Vietnam',
  },
]

const FAQ_ITEMS = [
  {
    q: 'What is Education Growth?',
    a: 'Education Growth is a simple family learning tracker. It helps parents keep all of their children’s school results in one place, so you can see how each child is doing and celebrate their progress together.',
  },
  {
    q: 'Who is this app for?',
    a: 'It’s made for parents and families who want an easy way to follow their children’s learning at home — no teacher account, no complicated setup. If you can type a score, you can use it.',
  },
  {
    q: 'How do I add and track my children’s scores?',
    a: 'Go to the “Add Score” page, pick the child, choose the grade and subject, and enter a score from 0 to 10. The Dashboard and each child’s page update automatically so you always see their latest averages.',
  },
  {
    q: 'What do the grades and tabs mean?',
    a: 'Each score is saved under the school grade it was earned in (for example Grade 8). On a child’s detail page you can switch between grades to see results year by year, which makes it easy to track long-term progress.',
  },
  {
    q: 'How do goals and rewards work?',
    a: 'You can set simple goals for each child, like “Score 9 in Math.” When a goal is completed you can mark it done and give a reward, which helps keep learning fun and motivating.',
  },
  {
    q: 'Where is my family’s data stored?',
    a: 'Your family’s data is saved securely in the cloud so it stays in sync across every device that opens your family link. Anyone with the link can view and update it, so keep the link within your family.',
  },
]

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in your name, email and message.')
      return
    }
    setError('')
    setSent(true)
    setName('')
    setEmail('')
    setSubject('')
    setMessage('')
  }

  return (
    <div className="page">
      <section className="hero contact-hero">
        <div className="hero-text">
          <h1>Contact Us</h1>
          <p>Home » Contact</p>
        </div>
      </section>

      <p className="contact-intro">
        Feel free to share your feedback as well as any queries or complaints regarding any content
        on our website and in the page. Send us a mail or simply fill the form given below. We will
        be there to help you!
      </p>

      <div className="contact-cards">
        {CONTACT_CARDS.map((c) => (
          <a
            key={c.label}
            className="card contact-card"
            href={c.href}
            target={c.href.startsWith('http') ? '_blank' : undefined}
            rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
          >
            <span className="contact-icon">
              <span className="contact-glyph">{c.icon}</span>
            </span>
            <span className="contact-label">{c.label}</span>
            <span className="contact-value">{c.value}</span>
          </a>
        ))}
      </div>

      <h2 className="get-in-touch">Get in Touch</h2>

      <form className="card form contact-form" onSubmit={handleSubmit}>
        {sent && (
          <p className="success">✅ Thanks! Your message has been sent. We'll get back to you soon.</p>
        )}

        <div className="form-row">
          <label>
            Name
            <input
              type="text"
              value={name}
              placeholder="Your name"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        </div>

        <label>
          Subject
          <input
            type="text"
            value={subject}
            placeholder="How can we help?"
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>

        <label>
          Message
          <textarea
            value={message}
            rows={5}
            placeholder="Write your message…"
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="btn primary">
          Submit
        </button>
      </form>

      <section className="faq">
        <h2 className="faq-title">Frequently asked questions</h2>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, i) => {
            const open = openFaq === i
            return (
              <div key={item.q} className={open ? 'faq-item open' : 'faq-item'}>
                <button
                  className="faq-question"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                >
                  <span>{item.q}</span>
                  <span className="faq-chevron">{open ? '⌃' : '⌄'}</span>
                </button>
                {open && <p className="faq-answer">{item.a}</p>}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
