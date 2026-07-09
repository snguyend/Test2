interface LineChartProps {
  data: { label: string; value: number }[]
  color?: string
  max?: number
}

const W = 640
const H = 240
const PAD = { top: 16, right: 16, bottom: 32, left: 32 }

export default function LineChart({ data, color = '#2563eb', max = 10 }: LineChartProps) {
  if (data.length === 0) {
    return <p className="muted">No data yet.</p>
  }

  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0

  const points = data.map((d, i) => {
    const x = PAD.left + (data.length > 1 ? i * stepX : innerW / 2)
    const y = PAD.top + innerH - (Math.min(d.value, max) / max) * innerH
    return { ...d, x, y }
  })

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${path} L ${points[points.length - 1].x} ${PAD.top + innerH} L ${points[0].x} ${PAD.top + innerH} Z`
  const gridLines = [0, max * 0.2, max * 0.4, max * 0.6, max * 0.8, max]
  const labelEvery = Math.ceil(points.length / 6)

  return (
    <svg
      className="line-chart"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Progress over time line chart"
    >
      {gridLines.map((g) => {
        const y = PAD.top + innerH - (g / max) * innerH
        return (
          <g key={g}>
            <line
              className="lc-grid"
              x1={PAD.left}
              y1={y}
              x2={W - PAD.right}
              y2={y}
            />
            <text className="lc-axis" x={PAD.left - 6} y={y + 4} textAnchor="end">
              {Math.round(g)}
            </text>
          </g>
        )
      })}

      <path className="lc-area" d={areaPath} style={{ fill: color }} />
      <path className="lc-line" d={path} style={{ stroke: color }} />

      {points.map((p, i) => (
        <g key={i}>
          <circle className="lc-dot" cx={p.x} cy={p.y} r={4} style={{ fill: color }} />
          {i % labelEvery === 0 && (
            <text className="lc-axis" x={p.x} y={H - PAD.bottom + 20} textAnchor="middle">
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
