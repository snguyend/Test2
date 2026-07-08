interface BarChartProps {
  data: { label: string; value: number }[]
  color?: string
  max?: number
}

export default function BarChart({ data, color = '#2563eb', max = 100 }: BarChartProps) {
  if (data.length === 0) {
    return <p className="muted">No data yet.</p>
  }

  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div key={i} className="bar-row">
          <span className="bar-label">{d.label}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(d.value / max) * 100}%`, background: color }}
            >
              <span className="bar-value">{d.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
