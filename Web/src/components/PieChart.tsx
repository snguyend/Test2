interface Slice {
  label: string
  value: number
  color: string
  avatar?: string
}

interface PieChartProps {
  data: Slice[]
  size?: number
  unit?: string
  center?: string
}

const STROKE = 26

export default function PieChart({ data, size = 190, unit = '', center }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total <= 0) {
    return <p className="muted">No data yet.</p>
  }

  const r = size / 2 - STROKE / 2
  const c = 2 * Math.PI * r
  const lengths = data.map((d) => (d.value / total) * c)
  const offsets = lengths.map(
    (_, i) => -lengths.slice(0, i).reduce((sum, len) => sum + len, 0),
  )

  return (
    <div className="pie-chart">
      <svg
        className="pie-svg"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Comparison by child"
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {data.map((d, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={STROKE}
              strokeDasharray={`${lengths[i]} ${c - lengths[i]}`}
              strokeDashoffset={offsets[i]}
            />
          ))}
        </g>
        <text className="pie-center" x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
          {center ?? data.length}
        </text>
      </svg>

      <ul className="pie-legend">
        {data.map((d, i) => (
          <li key={i}>
            <span className="pie-dot" style={{ background: d.color }} />
            <span className="pie-legend-label">
              {d.avatar ? `${d.avatar} ` : ''}
              {d.label}
            </span>
            <span className="pie-legend-value">
              {d.value}
              {unit} · {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
