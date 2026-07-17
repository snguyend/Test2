import { useAppData } from '../store-context'

const LABELS: Record<string, { icon: string; text: string; cls: string }> = {
  local: { icon: '💾', text: 'Local', cls: 'sync-local' },
  syncing: { icon: '🔄', text: 'Syncing…', cls: 'sync-busy' },
  synced: { icon: '☁️', text: 'Synced', cls: 'sync-ok' },
  error: { icon: '⚠️', text: 'Sync error', cls: 'sync-err' },
}

/** Small pill in the sidebar brand showing cloud sync status. */
export default function SyncIndicator() {
  const { syncState } = useAppData()
  const s = LABELS[syncState] ?? LABELS.local
  return (
    <span className={`sync-indicator ${s.cls}`} title={`Data: ${s.text}`}>
      <span className="sync-icon" aria-hidden>
        {s.icon}
      </span>
      <span className="sync-text">{s.text}</span>
    </span>
  )
}
