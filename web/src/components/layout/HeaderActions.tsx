import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CircleHelp, UserRound } from 'lucide-react'
import { IconButton, ThemeToggle } from '@/components/ui'
import { ROLE_LABELS, canAccess, type Role } from '@/lib/access'
import { DemoPanel } from './DemoPanel'

/** Сповіщення: випадна панель. Поки в синтетичних даних їх немає, це сказано прямо. */
function Notifications() {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])
  return (
    <div ref={wrap} className="relative">
      <IconButton
        label="Сповіщення"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        icon={<Bell className="size-5" />}
      />
      {open && (
        <div
          id={id}
          role="region"
          aria-label="Сповіщення"
          className="absolute right-0 top-full z-40 mt-2 w-64 rounded-lg border border-border bg-surface-raised p-3 shadow-lg"
        >
          <p className="m-0 text-body text-text">Нових сповіщень немає.</p>
        </div>
      )}
    </div>
  )
}

/** Праворуч у шапці: сповіщення, довідка, тема, роль користувача і «Демо». */
export function HeaderActions({ role }: { role: Role }) {
  return (
    <div data-print="hide" className="flex items-center gap-1">
      <Notifications />
      {canAccess(role, '/explain') && (
        <Link
          to="/explain"
          aria-label="Довідка: як розраховується індекс"
          title="Довідка: як розраховується індекс"
          className="touch-target inline-flex items-center justify-center rounded-md text-accent hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <CircleHelp aria-hidden className="size-5" />
        </Link>
      )}
      <ThemeToggle />
      <span className="mx-1 hidden items-center gap-1.5 text-caption text-text-muted md:inline-flex">
        <UserRound aria-hidden className="size-4" />
        <span>{ROLE_LABELS[role]}</span>
      </span>
      <DemoPanel />
    </div>
  )
}
