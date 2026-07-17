interface Props {
  className?: string
}

/**
 * Brand logo — a graduation cap over an upward growth arrow, echoing the app's
 * "education growth" theme. Rendered white/gold/green to sit on the header's
 * purple→pink→orange gradient badge.
 */
export default function BrandLogo({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Education Growth"
      fill="none"
    >
      {/* Upward growth arrow */}
      <path
        d="M7 37 L20 26 L27 31 L40 19"
        stroke="#22c55e"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M33 17.5 L41.5 16 L40.5 24.5 Z" fill="#22c55e" />

      {/* Mortarboard top */}
      <path d="M24 13 L43 21 L24 29 L5 21 Z" fill="#ffffff" />
      {/* Cap base */}
      <path
        d="M15 25 L15 33 C15 35.6 33 35.6 33 33 L33 25 L24 29 Z"
        fill="#f3e8ff"
      />
      {/* Tassel */}
      <line x1="43" y1="21" x2="43" y2="31" stroke="#fbbf24" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="43" cy="32.5" r="2.1" fill="#fbbf24" />
    </svg>
  )
}
