import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye,
  Info,
  ScrollText,
  ShieldCheck,
  Scale,
  TriangleAlert,
  SearchCheck,
  Sprout,
  TrendingUp,
  X,
} from 'lucide-react'
import { Card, SourceMarker, TrustBadge } from '@/components/ui'
import {
  FLAG_WEIGHT_LABEL,
  TRUST_GRADE_TEXT,
  TRUST_HINT,
  TRUST_LABEL,
} from '@/components/ui/messages'
import type { TrustFlag, TrustGrade } from '@/lib/scoring/trust'
import { cn } from '@/lib/cn'
import { LIMITER_MARGIN, fmt, type ComponentId } from '@/lib/scoring/methodology'
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
      className="flex items-center gap-3 rounded-md border border-border bg-accent-soft px-3 py-0.5 short:py-0"
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

export function TrustCard({ grade, raised }: { grade: TrustGrade; raised: TrustFlag[] }) {
  const major = raised.filter((f) => f.weight === 'major').length
  const minor = raised.length - major
  const counts = [major > 0 && `серйозних: ${major}`, minor > 0 && `незначних: ${minor}`].filter(
    Boolean,
  )
  return (
    <Card as="section" aria-labelledby="trust-h" className="p-4 md:p-4 short:p-3 short:md:p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="trust-h" className="card-title">
          <ShieldCheck aria-hidden />
          {TRUST_LABEL}
        </h2>
        <Num hint={TRUST_HINT}>
          <TrustBadge grade={grade} />
        </Num>
      </div>
      <p className="m-0 mt-2 flex items-start gap-2 text-body">
        <Scale aria-hidden className="mt-0.5 size-5 shrink-0 text-attention-text" />
        <span>
          {TRUST_GRADE_TEXT[grade].rule}{' '}
          <span className="short:hidden">
            {counts.length > 0 ? ` Спрацювало прапорців (${counts.join(', ')}), деталі нижче.` : ''}
          </span>
        </span>
      </p>
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
      category="attention"
      className="p-4 md:p-4 short:p-3 short:md:p-3"
    >
      <h2 id="lim-h" className="card-title">
        <Info aria-hidden />
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
      <svg
        viewBox="0 0 300 34"
        className="mt-2 h-auto w-full short:hidden"
        aria-hidden
        focusable="false"
      >
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
      <p className="m-0 mt-1 flex flex-wrap gap-x-4 text-caption text-text-muted short:hidden">
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
      <p className="m-0 mt-2 text-caption text-text-muted short:mt-1">
        Обмежувач не дає сприйняттю піднятися вище за факти більш ніж на {LIMITER_MARGIN} пунктів
        (це один рівень).<span className="short:hidden"> {reason}</span>
      </p>
    </Card>
  )
}

export interface Insight {
  id: string
  title: string
  value: number
  hint: string
  component?: ComponentId
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
      category={strength ? 'strength' : 'attention'}
      className="p-4 md:p-4 short:p-3 short:md:p-3"
    >
      <h2 className="card-title mb-2 short:mb-1">
        <Icon aria-hidden />
        {title}
      </h2>
      <ul className="m-0 flex list-none flex-col gap-2 short:gap-1 p-0">
        {items.map((it) => (
          <li
            key={it.id}
            className={cn(
              'flex items-start gap-2 rounded-md p-2 short:p-1.5',
              strength
                ? 'bg-strength-bg text-strength-text'
                : 'bg-attention-bg text-attention-text',
            )}
          >
            <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
            <Link
              to={it.component ? `/explain?c=${it.component}` : '/explain'}
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
    <Card as="section" aria-labelledby="concl-h" className="p-4 md:p-4 short:p-3 short:md:p-3">
      <h2 id="concl-h" className="card-title mb-2">
        <ScrollText aria-hidden />
        Короткий висновок
      </h2>
      <p className="m-0 text-body">{paragraphs}</p>
    </Card>
  )
}

export function FlagStrip({ flags }: { flags: TrustFlag[] }) {
  return (
    <section aria-labelledby="flags-h">
      <h2
        id="flags-h"
        className="m-0 mb-2 short:mb-1 flex flex-wrap items-baseline gap-x-3 text-card"
      >
        Варто перевірити додатково
        <span className="text-caption font-normal text-text-muted">
          Напрям для додаткового аналізу. Це не висновок про людей чи підрозділи.
        </span>
      </h2>
      <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
        {flags.map((f) => {
          const Icon = f.weight === 'major' ? TriangleAlert : SearchCheck
          return (
            <li
              key={f.id}
              className="flex items-start gap-3 rounded-lg border border-border border-l-4 border-l-attention-solid bg-surface p-3 short:p-2"
            >
              <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-attention-text" />
              <div>
                <p className="m-0 text-body font-semibold">
                  {f.title}
                  <span className="ml-2 whitespace-nowrap text-caption font-normal text-text-muted">
                    ({FLAG_WEIGHT_LABEL[f.weight]})
                  </span>
                </p>
                <p className="m-0 text-caption text-text-muted">{f.explanation}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
