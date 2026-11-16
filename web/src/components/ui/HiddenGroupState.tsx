import { EyeOff } from 'lucide-react'

export const HIDDEN_GROUP_TEXT =
  'Недостатньо відповідей, щоб показати результати цієї групи. Показано дані рівня вище. Це захищає анонімність учасників.'

export function HiddenGroupState() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-lg border border-border bg-surface-muted p-4 text-text"
    >
      <EyeOff aria-hidden className="mt-0.5 size-5 shrink-0 text-text-muted" />
      <p className="m-0 text-body">{HIDDEN_GROUP_TEXT}</p>
    </div>
  )
}
