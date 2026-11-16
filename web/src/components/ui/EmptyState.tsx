import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong bg-surface p-8 text-center">
      <span aria-hidden className="text-text-muted">
        {icon ?? <Inbox className="size-8" />}
      </span>
      <p className="m-0 text-card text-text">{title}</p>
      {description && <p className="m-0 max-w-prose text-body text-text-muted">{description}</p>}
      {action}
    </div>
  )
}
