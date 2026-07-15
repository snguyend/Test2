interface SubjectLogoProps {
  subject: string
  color: string
  size?: number
}

/**
 * Animated, gradient-based SVG badges for each subject.
 * Each logo shares a rounded "badge" backdrop so they feel like one family,
 * then layers a subject-specific illustration with lightweight CSS animation.
 */
export default function SubjectLogo({ subject, color, size = 96 }: SubjectLogoProps) {
  const gid = `grad-${subject.toLowerCase()}`
  const light = `color-mix(in srgb, ${color} 45%, #ffffff)`

  return (
    <svg
      className="subject-logo"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${subject} logo`}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>

      {/* shared badge backdrop */}
      <rect x="6" y="6" width="88" height="88" rx="26" fill={`url(#${gid})`} />
      <rect
        className="logo-ring"
        x="6"
        y="6"
        width="88"
        height="88"
        rx="26"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2"
        strokeDasharray="10 10"
      />

      <g className="logo-art">{renderArt(subject, color)}</g>
    </svg>
  )
}

function renderArt(subject: string, color: string) {
  const white = '#ffffff'
  switch (subject) {
    case 'Math':
      return (
        <>
          <text className="logo-pop" x="30" y="42" fontSize="20" fontWeight="800" fill={white}>
            +
          </text>
          <text className="logo-pop delay-1" x="58" y="42" fontSize="20" fontWeight="800" fill={white}>
            ÷
          </text>
          <text className="logo-pop delay-2" x="30" y="72" fontSize="20" fontWeight="800" fill={white}>
            ×
          </text>
          <text className="logo-pop delay-3" x="60" y="72" fontSize="20" fontWeight="800" fill={white}>
            −
          </text>
        </>
      )
    case 'Vietnamese':
      return (
        <path
          className="logo-spin-slow"
          fill={white}
          d="M50 26l6.5 13.4 14.8 2-10.7 10.3 2.6 14.7L50 59.6 36.8 66.4l2.6-14.7L28.7 41.4l14.8-2z"
        />
      )
    case 'Science':
      return (
        <>
          <circle cx="50" cy="50" r="6" fill={white} />
          <g className="logo-spin">
            <ellipse cx="50" cy="50" rx="24" ry="10" fill="none" stroke={white} strokeWidth="3" />
            <ellipse
              cx="50"
              cy="50"
              rx="24"
              ry="10"
              fill="none"
              stroke={white}
              strokeWidth="3"
              transform="rotate(60 50 50)"
            />
            <ellipse
              cx="50"
              cy="50"
              rx="24"
              ry="10"
              fill="none"
              stroke={white}
              strokeWidth="3"
              transform="rotate(120 50 50)"
            />
          </g>
        </>
      )
    case 'English':
      return (
        <>
          <text className="logo-float" x="28" y="46" fontSize="20" fontWeight="800" fill={white}>
            A
          </text>
          <text className="logo-float delay-1" x="44" y="52" fontSize="20" fontWeight="800" fill={white}>
            B
          </text>
          <text className="logo-float delay-2" x="60" y="46" fontSize="20" fontWeight="800" fill={white}>
            C
          </text>
          <path d="M30 66 h40" stroke={white} strokeWidth="3" strokeLinecap="round" />
        </>
      )
    case 'Reading':
      return (
        <g className="logo-float">
          <path d="M50 34c-6-4-14-4-20-2v34c6-2 14-2 20 2z" fill={white} opacity="0.92" />
          <path d="M50 34c6-4 14-4 20-2v34c-6-2-14-2-20 2z" fill={white} />
          <path d="M50 34v34" stroke={color} strokeWidth="1.5" opacity="0.4" />
        </g>
      )
    case 'Music':
      return (
        <g className="logo-bob">
          <path d="M44 30v28" stroke={white} strokeWidth="3" strokeLinecap="round" />
          <path d="M64 26v28" stroke={white} strokeWidth="3" strokeLinecap="round" />
          <path d="M44 30l20-4v8l-20 4z" fill={white} />
          <circle cx="40" cy="60" r="7" fill={white} />
          <circle cx="60" cy="56" r="7" fill={white} />
        </g>
      )
    case 'Physics':
      return (
        <>
          <circle className="logo-pulse" cx="50" cy="50" r="5" fill={white} />
          <g className="logo-spin">
            <ellipse cx="50" cy="50" rx="26" ry="11" fill="none" stroke={white} strokeWidth="3" />
            <ellipse
              cx="50"
              cy="50"
              rx="26"
              ry="11"
              fill="none"
              stroke={white}
              strokeWidth="3"
              transform="rotate(120 50 50)"
            />
            <ellipse
              cx="50"
              cy="50"
              rx="26"
              ry="11"
              fill="none"
              stroke={white}
              strokeWidth="3"
              transform="rotate(240 50 50)"
            />
          </g>
        </>
      )
    case 'Chemistry':
      return (
        <>
          <path
            d="M44 28h12v14l12 22a5 5 0 0 1-4.5 7.2H36.5A5 5 0 0 1 32 64l12-22z"
            fill="none"
            stroke={white}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M38 56h24" stroke={white} strokeWidth="3" />
          <circle className="logo-rise" cx="46" cy="60" r="3" fill={white} />
          <circle className="logo-rise delay-2" cx="55" cy="64" r="2.5" fill={white} />
        </>
      )
    case 'Biology':
      return (
        <g className="logo-float">
          <path d="M40 28c20 10 0 24 20 34" fill="none" stroke={white} strokeWidth="3" strokeLinecap="round" />
          <path d="M60 28c-20 10 0 24-20 34" fill="none" stroke={white} strokeWidth="3" strokeLinecap="round" />
          <path d="M42 36h16M40 46h20M40 56h20M42 64h16" stroke={white} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )
    case 'Geology':
      return (
        <g className="logo-float">
          <path d="M26 70l16-26 10 14 8-12 14 24z" fill={white} opacity="0.9" />
          <path d="M42 44l10 14 8-12" fill="none" stroke={color} strokeWidth="2" opacity="0.5" />
          <circle cx="66" cy="34" r="5" fill={white} />
        </g>
      )
    case 'Astronomy':
      return (
        <>
          <circle cx="50" cy="50" r="12" fill={white} />
          <g className="logo-spin">
            <ellipse
              cx="50"
              cy="50"
              rx="26"
              ry="9"
              fill="none"
              stroke={white}
              strokeWidth="3"
              transform="rotate(-20 50 50)"
            />
          </g>
          <circle className="logo-twinkle" cx="30" cy="30" r="2.5" fill={white} />
          <circle className="logo-twinkle delay-2" cx="72" cy="34" r="2" fill={white} />
          <circle className="logo-twinkle delay-1" cx="70" cy="70" r="2.5" fill={white} />
        </>
      )
    default:
      return <circle cx="50" cy="50" r="16" fill="#ffffff" />
  }
}
