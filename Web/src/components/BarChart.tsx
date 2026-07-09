import { MAX_SCORE, scoreColor } from '../utils/scores'

interface BarChartProps {
  data: { label: string; value: number }[]
  max?: number
}

export default function BarChart({ data, max = MAX_SCORE }: BarChartProps) {
  if (data.length === 0) {
    return <p className="muted">No data yet.</p>
  }

  return (
    <div className="bar-chart">
      {data.map((d, i) => {
        const c = scoreColor(d.value)
        return (
          <div key={i} className="bar-row">
            <span className="bar-label">{d.label}</span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${(d.value / max) * 100}%`,
                  background: `linear-gradient(90deg, ${c}, color-mix(in srgb, ${c} 55%, #ffffff))`,
                }}
              >
                <span className="bar-value">{d.value}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
