import { useState } from 'react'
import type { ReactNode } from 'react'

interface CollapsibleSectionProps {
  title: string
  icon?: string
  defaultOpen?: boolean
  children: ReactNode
}

export default function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={open ? 'collapsible open' : 'collapsible'}>
      <button className="collapsible-header" onClick={() => setOpen((v) => !v)}>
        <span className="collapsible-title">
          {icon && <span className="collapsible-icon">{icon}</span>}
          {title}
        </span>
        <span className="chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  )
}
