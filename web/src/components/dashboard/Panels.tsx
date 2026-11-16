import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, FileQuestion, Info, Scale, SearchCheck, Sprout, TrendingUp, X } from 'lucide-react'
import { Card, SourceMarker, TrustBadge, type TrustLevel } from '@/components/ui'
import { cn } from '@/lib/cn'
import { LIMITER_MARGIN, fmt } from '@/lib/scoring/methodology'
import { Num } from './Num'

export function DevelopmentBanner() {
  const [shown, setShown] = useState(() => {
    try {
      return localStorage.getItem('banner-dev-closed') !== '1'
    } catch {
      return true
    }
  })
  if (!shown) return null
  return (
    <div
      role="note"
      data-print="hide"
      className="flex items-center gap-3 rounded-md border border-border bg-accent-soft px-3 py-1.5"
    >
      <Sprout aria-hidden className="size-5 shrink-0 text-accent" />
      <p className="m-0 flex-1 text-caption text-text">
        Оцінювання це інструмент розвитку, а не контролю. Результати показують, куди рухатися далі.
      </p>
      <button
        type="button"
        aria-label="Закрити повідомлення"
        className="touch-target inline-flex items-center justify-center rounded-md text-text hover:bg-surface"
        onClick={() => {
          setShown(false)
          try {
            localStorage.setItem('banner-dev-closed', '1')
          } catch {
            /* без збереження */
          }
        }}
      >
        <X aria-hidden className="size-5" />
      </button>
    </div>
  )
}

export function TrustCard({ level, reasons }: { level: TrustLevel; reasons: string[] }) {
  return (
    <Card as="section" aria-labelledby="trust-h" className="p-4 md:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="trust-h" className="m-0 text-card">
          Довіра до оцінки
        </h2>
        <Num hint="Наскільки результатам можна вірити: залежить від кількості відповідей, підтвердження фактів і розбіжності між сприйняттям та фактами.">
          <TrustBadge level={level} />
        </Num>
      </div>
      <p className="m-0 mt-1 text-caption text-text-muted">
        Чи можна вірити цьому результату. Причини:
      </p>
      <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
        {reasons.map((r, i) => {
          const Icon = i === 0 ? Scale : FileQuestion
          return (
            <li key={r} className="flex items-start gap-2 text-body">
              <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-attention-text" />
              {r}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function LimiterBlock({
  label,
  perception,
  facts,
  credited,
  reason,
}: {
  label: string
  perception: number
  facts: number
  credited: number
  reason?: string
}) {
  const x = (v: number) => `${v}%`
  return (
    <Card
      as="section"
      aria-labelledby="lim-h"
      className="border-l-4 border-l-attention-solid p-4 md:p-4"
    >
      <h2 id="lim-h" className="m-0 flex items-center gap-2 text-card">
        <Info aria-hidden className="size-5 shrink-0 text-attention-text" />
        Показано з обмеженням
      </h2>
      <p className="m-0 mt-1 text-body">
        {label}:{' '}
        <Num hint="Оцінка за анкетами респондентів (робоча група, особовий склад, експерти).">
          сприйняття {fmt(perception)}
        </Num>
        ,{' '}
        <Num hint="Оцінка за чек-листом і метриками, підтвердженими документами.">
          факти {fmt(facts)}
        </Num>
        ,{' '}
        <Num hint="Значення, що йде в індекс після обмежувача: не вище за факти плюс 25 пунктів.">
          <strong>зараховано {fmt(credited)}</strong>
        </Num>
        .
      </p>
      <svg viewBox="0 0 300 34" className="mt-2 h-auto w-full" aria-hidden focusable="false">
        <rect x="0" y="12" width="300" height="10" rx="5" fill="var(--color-surface-muted)" />
        <rect
          x="0"
          y="12"
          width={credited * 3}
          height="10"
          rx="5"
          fill="var(--color-attention-solid)"
        />
        <circle cx={perception * 3} cy="17" r="7" fill={'var(--color-source-wg)'} />
        <path
          d={`M${facts * 3} 8l7 13h-14z`}
          fill="var(--color-source-facts)"
          stroke="var(--color-surface)"
          strokeWidth="1"
        />
        <line
          x1={credited * 3}
          y1="4"
          x2={credited * 3}
          y2="30"
          stroke="var(--color-text)"
          strokeWidth="2"
        />
        <title>{`Шкала 0-100: факти ${x(facts)}, сприйняття ${x(perception)}, зараховано ${x(credited)}`}</title>
      </svg>
      <p className="m-0 mt-1 flex flex-wrap gap-x-4 text-caption text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <SourceMarker source="wg" /> Сприйняття
        </span>
        <span className="inline-flex items-center gap-1.5">
          <SourceMarker source="facts" /> Факти
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-3 w-0.5 bg-text" /> Зараховано
        </span>
      </p>
      <p className="m-0 mt-2 text-caption text-text-muted">
        Обмежувач не дає сприйняттю піднятися вище за факти більш ніж на {LIMITER_MARGIN} пунктів
        (це один рівень). {reason}
      </p>
    </Card>
  )
}

export interface Insight {
  id: string
  title: string
  value: number
  hint: string
}

export function InsightList({
  title,
  kind,
  items,
}: {
  title: string
  kind: 'strength' | 'attention'
  items: Insight[]
}) {
  const strength = kind === 'strength'
  const Icon = strength ? TrendingUp : Eye
  return (
    <Card
      as="section"
      aria-label={title}
      className={cn(
        'border-t-4 p-4 md:p-4',
        strength ? 'border-t-strength-solid' : 'border-t-attention-solid',
      )}
    >
      <h2 className="m-0 mb-2 text-card">{title}</h2>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {items.map((it) => (
          <li
            key={it.id}
            className={cn(
              'flex items-start gap-2 rounded-md p-2',
              strength
                ? 'bg-strength-bg text-strength-text'
                : 'bg-attention-bg text-attention-text',
            )}
          >
            <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
            <Link
              to="/explain"
              className="flex-1 text-body text-inherit underline-offset-2 hover:underline"
            >
              {it.title}
            </Link>
            <Num hint={it.hint} className="shrink-0 font-semibold">
              {fmt(it.value)}
            </Num>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function Conclusion({ paragraphs }: { paragraphs: string }) {
  return (
    <Card as="section" aria-labelledby="concl-h" className="p-4 md:p-4">
      <h2 id="concl-h" className="m-0 mb-2 text-card">
        Короткий висновок
      </h2>
      <p className="m-0 text-body-lg">{paragraphs}</p>
    </Card>
  )
}

export function FlagStrip({ flags }: { flags: { id: string; title: string; text: string }[] }) {
  return (
    <section aria-labelledby="flags-h">
      <h2 id="flags-h" className="m-0 mb-2 flex flex-wrap items-baseline gap-x-3 text-card">
        Варто перевірити додатково
        <span className="text-caption font-normal text-text-muted">
          Напрям для додаткового аналізу. Це не висновок про людей чи підрозділи.
        </span>
      </h2>
      <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-3">
        {flags.map((f) => (
          <li
            key={f.id}
            className="flex items-start gap-3 rounded-lg border border-border border-l-4 border-l-attention-solid bg-surface p-3"
          >
            <SearchCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-attention-text" />
            <div>
              <p className="m-0 text-body font-semibold">{f.title}</p>
              <p className="m-0 text-caption text-text-muted">{f.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
