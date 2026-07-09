// Static particle definitions (kept module-level so render stays pure/deterministic).
const PARTICLES = [
  { left: '6%', size: 7, dur: 11, delay: 0 },
  { left: '14%', size: 4, dur: 9, delay: 2.5 },
  { left: '22%', size: 9, dur: 14, delay: 1 },
  { left: '31%', size: 5, dur: 10, delay: 4 },
  { left: '40%', size: 6, dur: 12, delay: 0.5 },
  { left: '48%', size: 3, dur: 8, delay: 3 },
  { left: '57%', size: 8, dur: 13, delay: 1.8 },
  { left: '65%', size: 5, dur: 10, delay: 5 },
  { left: '73%', size: 7, dur: 12, delay: 2 },
  { left: '81%', size: 4, dur: 9, delay: 3.6 },
  { left: '88%', size: 6, dur: 15, delay: 0.8 },
  { left: '94%', size: 5, dur: 11, delay: 4.4 },
]

export default function Particles({ className = '' }: { className?: string }) {
  return (
    <div className={`particles ${className}`} aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
