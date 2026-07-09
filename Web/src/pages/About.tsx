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

export default function About() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

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
          <p>Home » About Us</p>
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
            <span className="contact-icon">{c.icon}</span>
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
    </div>
  )
}
