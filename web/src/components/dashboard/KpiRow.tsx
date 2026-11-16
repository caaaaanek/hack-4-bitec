import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlarmClock,
  ArrowUp,
  ArrowDown,
  Eye,
  ListChecks,
  Minus,
  ShieldCheck,
  Gauge,
} from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/cn'

interface TileProps {
  label: string
  value: ReactNode
  /** Рядок «що це» або підпис значення: число завжди пояснене текстом. */
  sub: ReactNode
  icon: ReactNode
  /** Куди веде плитка; без цього плитка статична. */
  to?: string
  onClick?: () => void
  href?: string
  actionLabel: string
}

function Tile({ label, value, sub, icon, to, onClick, href, actionLabel }: TileProps) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-caption font-semibold text-text-muted">
        <span aria-hidden className="inline-flex size-4 items-center justify-center">
          {icon}
        </span>
        {label}
      </span>
      <span className="mt-1 flex items-center gap-x-3">
        <span className="text-numeral tabular short:text-section">{value}</span>
        <span className="flex min-w-0 flex-col gap-0.5 whitespace-nowrap text-caption leading-4 text-text-muted">
          {sub}
        </span>
      </span>
    </>
  )
  const cls =
    'block h-full rounded-lg p-3 text-text no-underline short:px-3 short:py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'
  let el: ReactNode
  if (to) {
    el = (
      <Link to={to} aria-label={actionLabel} className={cls}>
        {body}
      </Link>
    )
  } else if (href) {
    el = (
      <a href={href} aria-label={actionLabel} className={cls}>
        {body}
      </a>
    )
  } else if (onClick) {
    el = (
      <button
        type="button"
        onClick={onClick}
        aria-label={actionLabel}
        className={cn(cls, 'w-full text-left')}
      >
        {body}
      </button>
    )
  } else {
    el = <div className={cls}>{body}</div>
  }
  return (
    <li className="min-w-0">
      <Card
        className={cn(
          'h-full p-0 md:p-0',
          (to || href || onClick) && 'transition-colors hover:bg-surface-muted',
        )}
      >
        {el}
      </Card>
    </li>
  )
}

export interface KpiRowProps {
  index: string
  level: string
  deltaText: string
  deltaDir: 'up' | 'down' | 'same'
  trustLetter: string
  trustWord: string
  flagCount: number
  attentionCount: number
  measuresTotal: number
  measuresOverdue: number
  onOpenFlags: () => void
  /** null: роль не має доступу до трекера, плитка без переходу. */
  trackerHref: string | null
}

/** Ряд із чотирьох KPI-плиток: кожна клікабельна і пояснена текстом. */
export function KpiRow(p: KpiRowProps) {
  const Arrow = p.deltaDir === 'up' ? ArrowUp : p.deltaDir === 'down' ? ArrowDown : Minus
  return (
    <ul
      aria-label="Ключові показники"
      className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 xl:grid-cols-4 short:gap-2"
    >
      <Tile
        label="Індекс доброчесності"
        icon={<Gauge className="size-4" />}
        value={p.index}
        sub={
          <>
            <span>{p.level}</span>
            <span className="inline-flex items-center gap-0.5 font-semibold text-text">
              <Arrow aria-hidden className="size-3.5" />
              {p.deltaText}
            </span>
          </>
        }
        to="/explain"
        actionLabel={`Індекс доброчесності ${p.index} з 100: відкрити розклад`}
      />
      <Tile
        label="Достовірність"
        icon={<ShieldCheck className="size-4" />}
        value={p.trustLetter}
        sub={
          <>
            <span>{p.trustWord}</span>
            <span className="inline-flex items-center gap-0.5 font-semibold text-text">
              <Eye aria-hidden className="size-3.5" />
              Прапорці: {p.flagCount}
            </span>
          </>
        }
        onClick={p.onOpenFlags}
        actionLabel={`Достовірність ${p.trustLetter}, прапорці: ${p.flagCount}. Відкрити пояснення`}
      />
      <Tile
        label="Напрями, що потребують уваги"
        icon={<Eye className="size-4" />}
        value={p.attentionCount}
        sub="З трьох компонентів індексу"
        href="#attention"
        actionLabel={`Напрямів, що потребують уваги: ${p.attentionCount}. Перейти до списку`}
      />
      <Tile
        label="Заходи в трекері"
        icon={<ListChecks className="size-4" />}
        value={p.measuresTotal}
        sub={
          p.measuresOverdue > 0 ? (
            <span className="inline-flex items-center gap-0.5 font-semibold text-text">
              <AlarmClock aria-hidden className="size-3.5" />
              {`З них ${p.measuresOverdue} прострочено`}
            </span>
          ) : (
            'Прострочених немає'
          )
        }
        to={p.trackerHref ?? undefined}
        actionLabel={`Заходи в трекері: ${p.measuresTotal}, з них прострочено ${p.measuresOverdue}`}
      />
    </ul>
  )
}
