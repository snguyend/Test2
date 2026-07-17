import { useState } from 'react'
import { useAuth } from '../auth-context'
import { useAppData } from '../store-context'
import { STORAGE_KEYS, loadState, saveState } from '../utils/storage'
import type { Student } from '../types'

/**
 * One-time banner shown right after signing into an EMPTY cloud family while
 * local data exists — offers to import it. Dismissal is remembered per family.
 */
export default function ImportPrompt() {
  const { enabled, user, familyId, importLocalData } = useAuth()
  const { remote, students, reload } = useAppData()
  const [state, setState] = useState<'idle' | 'importing' | 'done' | 'hidden'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const dismissKey = familyId ? `eg-import-dismissed:${familyId}` : ''
  const alreadyDismissed = dismissKey ? loadState<boolean>(dismissKey, false) : false
  const localStudents = loadState<Student[]>(STORAGE_KEYS.students, [])

  // Eligible only when: signed in, cloud family empty, and local data exists.
  const eligible =
    enabled &&
    !!user &&
    remote &&
    students.length === 0 &&
    localStudents.length > 0 &&
    !alreadyDismissed

  const visible = state !== 'hidden' && (eligible || state === 'importing' || state === 'done')
  if (!visible) return null

  const runImport = async () => {
    setState('importing')
    setMessage(null)
    try {
      const s = await importLocalData()
      setMessage(
        `Imported ${s.students} children, ${s.scores} scores, ${s.goals} goals, ${s.habits} habits, ${s.photos} photos.`,
      )
      setState('done')
      reload() // refresh the store so the imported data appears
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Import failed.')
      setState('idle')
    }
  }

  const dismiss = () => {
    if (dismissKey) saveState(dismissKey, true)
    setState('hidden')
  }

  return (
    <div className="import-prompt" role="status">
      <span className="import-prompt-icon" aria-hidden>
        ☁️
      </span>
      {state === 'done' ? (
        <>
          <span className="import-prompt-text">{message ?? 'Import complete.'}</span>
          <button className="import-prompt-btn ghost" onClick={dismiss}>
            Close
          </button>
        </>
      ) : (
        <>
          <span className="import-prompt-text">
            {message ??
              `Found data for ${localStudents.length} ${
                localStudents.length === 1 ? 'child' : 'children'
              } on this device. Import it into your cloud account?`}
          </span>
          <button
            className="import-prompt-btn primary"
            onClick={runImport}
            disabled={state === 'importing'}
          >
            {state === 'importing' ? 'Importing…' : 'Import'}
          </button>
          <button
            className="import-prompt-btn ghost"
            onClick={dismiss}
            disabled={state === 'importing'}
          >
            Not now
          </button>
        </>
      )}
    </div>
  )
}
