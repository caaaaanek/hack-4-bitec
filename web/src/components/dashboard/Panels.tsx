import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  Info,
  Layers,
  Scale,
  ShieldCheck,
  SearchCheck,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import { Badge, Card, MaturityBadge, Tooltip, ChangeChip } from '@/components/ui'
import type { MaturityLevel } from '@/components/ui'
import {
  FLAG_WEIGHT_LABEL,
  TRUST_GRADE_TEXT,
  TRUST_HINT,
  TRUST_LABEL,
} from '@/components/ui/messages'
import type { TrustFlag, TrustGrade } from '@/lib/scoring/trust'
import { cn } from '@/lib/cn'
import { COMPONENT_LABELS, fmt, type ComponentId } from '@/lib/scoring/methodology'
import { Num } from './Num'

export interface ComponentRow {
  id: ComponentId
  value: number
  level: MaturityLevel
  /** Зміна до попереднього циклу, пункти. */
  delta: number
  /** Пояснення обмежувача (лише коли спрацював). */
  limitedHint?: string
}

const COMPONENT_BAR: Record<ComponentId, string> = {
  culture: 'bg-cat-culture',
  system: 'bg-cat-system',
  accountability: 'bg-cat-accountability',
}

/** Три компоненти в одній картці: кожен рядок веде на розклад цього компонента. */
export function ComponentsCard({ rows, className }: { rows: ComponentRow[]; className?: string }) {
  return (
    <Card
      as="section"
      aria-labelledby="comp-h"
      className={cn('flex flex-col p-4 short:p-3 md:p-4 short:md:p-3', className)}
    >
      <h2 id="comp-h" className="card-title mb-2">
        <Layers aria-hidden />
        Компоненти індексу
      </h2>
      <ul className="m-0 flex flex-1 list-none flex-col divide-y divide-border p-0">
        {rows.map((r) => (
          <li
            key={r.id}
            className="relative flex flex-1 items-center gap-3 py-2 first:pt-0 last:pb-0 hover:bg-surface-raised"
          >
            <span
              aria-hidden
              className={cn('w-0.5 self-stretch rounded-full', COMPONENT_BAR[r.id])}
            />
            <div className="min-w-0 flex-1">
              <Link
                to={`/explain?c=${r.id}`}
                className="text-body font-semibold text-text no-underline after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {COMPONENT_LABELS[r.id]}
                <span className="sr-only">: розклад компонента</span>
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <MaturityBadge level={r.level} />
                {r.limitedHint && (
                  <span className="relative z-10">
                    <Tooltip content={r.limitedHint}>
                      <Badge tone="attention">
                        <Info aria-hidden className="size-3.5" />
                        Зараховано з обмеженням
                      </Badge>
                    </Tooltip>
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-section font-bold leading-none tabular">{fmt(r.value)}</span>
              <ChangeChip delta={r.delta} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

const GRADE_BOX: Record<TrustGrade, string> = {
  A: 'bg-strength-bg text-strength-text',
  B: 'bg-attention-bg text-attention-text',
  C: 'bg-attention-bg text-attention-text ring-2 ring-attention-solid',
  insufficient: 'bg-neutral-bg text-neutral-text',
}

/** Достовірність: велика літера, причина, згорнутий список прапорців. */
export function TrustPanel({
  grade,
  raised,
  reason,
  className,
}: {
  grade: TrustGrade
  raised: TrustFlag[]
  reason: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const t = TRUST_GRADE_TEXT[grade]
  return (
    <Card
      as="section"
      aria-labelledby="trust-h"
      className={cn('flex flex-col p-4 short:p-3 md:p-4 short:md:p-3', className)}
    >
      <h2 id="trust-h" className="card-title mb-2">
        <ShieldCheck aria-hidden />
        {TRUST_LABEL}
      </h2>
      <div className="flex items-center gap-3">
        <Num hint={TRUST_HINT}>
          <span
            data-trust={grade}
            className={cn(
              'flex size-14 items-center justify-center rounded-md text-display font-bold leading-none short:size-12 short:text-title',
              GRADE_BOX[grade],
            )}
          >
            <span aria-hidden>{t.letter}</span>
            <span className="sr-only">
              {TRUST_LABEL}: {t.letter}
            </span>
          </span>
        </Num>
        <div className="min-w-0">
          <p className="m-0 flex items-center gap-1.5 text-body font-semibold">
            <Scale aria-hidden className="size-4 shrink-0 text-attention-text" />
            {t.word}
          </p>
          <p className="m-0 mt-1 text-caption text-text-muted">{reason}</p>
        </div>
      </div>
      {raised.length > 0 && (
        <div className="mt-3 border-t border-border pt-2">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((v) => !v)}
            className="touch-h inline-flex items-center gap-1.5 rounded-sm text-body font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Прапорці ({raised.length})
            <ArrowRight
              aria-hidden
              className={cn('size-4 transition-transform', open && 'rotate-90')}
            />
          </button>
          <div id={listId} hidden={!open}>
            <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
              {raised.map((f) => {
                const Icon = f.weight === 'major' ? TriangleAlert : SearchCheck
                return (
                  <li key={f.id} className="flex items-start gap-2">
                    <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-attention-text" />
                    <div>
                      <p className="m-0 text-body font-semibold">
                        {f.title}{' '}
                        <span className="rounded-sm border border-border px-1.5 text-caption font-normal text-text-muted">
                          {FLAG_WEIGHT_LABEL[f.weight]}
                        </span>
                      </p>
                      <p className="m-0 text-caption text-text-muted">{f.explanation}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
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

/** «Що потребує уваги»: три напрями рядками з переходом, нижче сильні сторони чипами. */
export function AttentionPanel({
  attention,
  strengths,
  className,
}: {
  attention: Insight[]
  strengths: Insight[]
  className?: string
}) {
  const to = (it: Insight) => (it.component ? `/explain?c=${it.component}` : '/explain')
  return (
    <Card
      as="section"
      aria-labelledby="attn-h"
      className={cn('flex flex-col p-4 short:p-3 md:p-4 short:md:p-3', className)}
    >
      <h2 id="attn-h" className="card-title mb-2">
        <Eye aria-hidden />
        Що потребує уваги
      </h2>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {attention.map((it) => (
          <li key={it.id}>
            <Link
              to={to(it)}
              title={it.hint}
              className="flex items-center gap-2 rounded-md bg-attention-bg px-2 py-1.5 text-attention-text no-underline hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <Eye aria-hidden className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 text-body">{it.title}</span>
              {it.component && (
                <span className="shrink-0 text-caption font-semibold">
                  {COMPONENT_LABELS[it.component]}
                </span>
              )}
              <ArrowRight aria-hidden className="size-4 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t border-border pt-2">
        <p className="m-0 mb-1 text-caption font-semibold text-text-muted">Сильні сторони</p>
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {strengths.map((it) => (
            <li key={it.id}>
              <Link
                to={to(it)}
                title={it.hint}
                className="inline-flex items-center gap-1.5 rounded-sm bg-strength-bg px-2 py-1 text-caption font-medium text-strength-text no-underline hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <TrendingUp aria-hidden className="size-3.5 shrink-0" />
                {it.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
