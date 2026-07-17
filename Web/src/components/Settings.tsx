import { useState } from 'react'
import CollapsibleSection from './CollapsibleSection'
import { TONES, useTheme } from '../theme-context'
import { useAuth } from '../auth-context'
import { useAppData } from '../store-context'

export default function Settings() {
  const { mode, tone, setMode, setTone } = useTheme()
  const { enabled, user, signOut, importLocalData } = useAuth()
  const { reload } = useAppData()
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const runImport = async () => {
    setImporting(true)
    setImportMsg(null)
    try {
      const s = await importLocalData()
      setImportMsg(
        `Imported ${s.students} students, ${s.scores} scores, ${s.goals} goals, ${s.habits} habits, ${s.photos} photos.`,
      )
      reload()
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

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

        {enabled && user && (
          <div className="setting-group account-group">
            <span className="setting-label">Account</span>
            <span className="account-email">{user.email}</span>
            <button
              type="button"
              className="btn account-import"
              onClick={runImport}
              disabled={importing}
            >
              {importing ? 'Importing…' : '☁️ Import local data'}
            </button>
            {importMsg && <span className="account-msg muted">{importMsg}</span>}
            <button type="button" className="btn account-signout" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        )}
      </CollapsibleSection>
    </div>
  )
}
