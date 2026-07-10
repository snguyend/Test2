import CollapsibleSection from './CollapsibleSection'
import { TONES, useTheme } from '../theme-context'

export default function Settings() {
  const { mode, tone, setMode, setTone } = useTheme()

  return (
    <div className="sidebar-settings">
      <CollapsibleSection title="Cài Đặt (Setting)" icon="⚙️">
        <div className="setting-group">
          <span className="setting-label">Giao Diện</span>
          <button
            type="button"
            role="switch"
            aria-checked={mode === 'dark'}
            aria-label="Toggle light and dark mode"
            className={`theme-toggle ${mode}`}
            onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
          >
            <span className="tt-track">
              <span className="tt-star s1" />
              <span className="tt-star s2" />
              <span className="tt-star s3" />
              <span className="tt-thumb">{mode === 'light' ? '☀️' : '🌙'}</span>
            </span>
            <span className="tt-caption">{mode === 'light' ? 'Sáng' : 'Tối'}</span>
          </button>
        </div>

        <div className="setting-group">
          <span className="setting-label">Tông Màu</span>
          <div className="tones">
            {TONES.map((t) => (
              <button
                key={t.id}
                className={tone === t.id ? 'tone active' : 'tone'}
                style={{ background: t.swatch }}
                onClick={() => setTone(t.id)}
                title={t.name}
                aria-label={t.name}
              />
            ))}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  )
}
