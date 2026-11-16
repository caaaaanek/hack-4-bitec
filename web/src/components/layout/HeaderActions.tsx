import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CalendarDays, CircleHelp } from 'lucide-react'
import { IconButton, ThemeToggle, Tooltip } from '@/components/ui'
import { CYCLE } from '@/demo/data'
import { canAccess, type Role } from '@/lib/access'
import { DemoPanel } from './DemoPanel'

const roundBtn =
  '!size-[38px] !min-h-0 !min-w-0 !rounded-[12px] !p-0 border border-border bg-surface hover:bg-surface-muted'

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
    <div ref={wrap} className="relative hidden md:block">
      <IconButton
        label="Сповіщення"
        className={roundBtn}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        icon={<Bell className="size-[18px]" />}
      />
      {open && (
        <div
          id={id}
          role="region"
          aria-label="Сповіщення"
          className="absolute right-0 top-full z-40 mt-2 w-64 rounded-lg border border-border bg-surface-raised p-3 shadow-md"
        >
          <p className="m-0 text-body text-text">Нових сповіщень немає.</p>
        </div>
      )}
    </div>
  )
}

/** Праворуч у верхній панелі: «Синтетичні дані», цикл, сповіщення, довідка, тема, аватар ролі з демо-панеллю. */
export function HeaderActions({ role }: { role: Role }) {
  return (
    <div data-print="hide" className="flex items-center gap-2">
      <span className="hidden rounded-full border border-border px-2.5 py-1 text-fine font-normal text-text-muted md:inline-block">
        Синтетичні дані
      </span>
      <Tooltip
        placement="bottom"
        content="Цикл оцінювання: один повний раунд опитування й збору фактів. Індекс порівнюється з попереднім циклом."
      >
        <span className="hidden h-[38px] items-center gap-2 rounded-full border border-border bg-surface px-3.5 text-body font-medium text-text md:inline-flex">
          <CalendarDays aria-hidden className="size-4 text-text-muted" />
          Цикл {CYCLE}
        </span>
      </Tooltip>
      <Notifications />
      {canAccess(role, '/explain') && (
        <Link
          to="/explain"
          aria-label="Довідка: як розраховується індекс"
          title="Довідка: як розраховується індекс"
          className="hidden size-[38px] items-center justify-center rounded-[12px] border border-border bg-surface text-text hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:inline-flex"
        >
          <CircleHelp aria-hidden className="size-[18px]" />
        </Link>
      )}
      <ThemeToggle />
      <DemoPanel />
    </div>
  )
}
