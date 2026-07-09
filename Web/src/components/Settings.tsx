import CollapsibleSection from './CollapsibleSection'
import { TONES, useTheme } from '../theme-context'

export default function Settings() {
  const { mode, tone, setMode, setTone } = useTheme()

  return (
    <div className="sidebar-settings">
      <CollapsibleSection title="Cài Đặt (Setting)" icon="⚙️">
        <div className="setting-group">
          <span className="setting-label">Giao Diện</span>
          <div className="seg">
            <button
              className={mode === 'light' ? 'seg-btn active' : 'seg-btn'}
              onClick={() => setMode('light')}
            >
              ☀️ Sáng
            </button>
            <button
              className={mode === 'dark' ? 'seg-btn active' : 'seg-btn'}
              onClick={() => setMode('dark')}
            >
              🌙 Tối
            </button>
          </div>
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
