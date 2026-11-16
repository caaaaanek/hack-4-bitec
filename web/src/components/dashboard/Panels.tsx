import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  FileText,
  GraduationCap,
  Info,
  Layers,
  Scale,
  SearchCheck,
  Users,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import {
  Badge,
  BigNumber,
  Card,
  IconCircle,
  MaturityBadge,
  Tooltip,
  ChangeChip,
} from '@/components/ui'
import type { MaturityLevel } from '@/components/ui'
import { cn } from '@/lib/cn'
import { COMPONENT_LABELS, fmt, type ComponentId } from '@/lib/scoring/methodology'

export interface ComponentRow {
  id: ComponentId
  value: number
  level: MaturityLevel
  /** Зміна до попереднього циклу, пункти. */
  delta: number
  /** Пояснення обмежувача (лише коли спрацював). */
  limitedHint?: string
}

const COMPONENT_ICON: Record<ComponentId, LucideIcon> = {
  culture: Users,
  system: Layers,
  accountability: Scale,
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
        {rows.map((r) => {
          const Icon = COMPONENT_ICON[r.id]
          return (
            <li
              key={r.id}
              className="relative flex flex-1 items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:bg-surface-muted/50"
            >
              <IconCircle tone={r.id} size={32}>
                <Icon className="size-4" />
              </IconCircle>
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
                <BigNumber value={fmt(r.value)} />
                <ChangeChip delta={r.delta} />
              </div>
            </li>
          )
        })}
      </ul>
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

const ACTION_ICON: Record<ComponentId, LucideIcon> = {
  accountability: SearchCheck,
  system: FileText,
  culture: GraduationCap,
}

/** «Що потребує уваги»: нейтральні рядки з тонким жовтим маркером, нижче сильні сторони із зеленим. */
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
  const row =
    'flex items-center gap-3 rounded-[10px] px-1.5 py-2 text-text no-underline short:py-1.5 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'
  return (
    <Card
      as="section"
      id="attention"
      aria-labelledby="attn-h"
      className={cn('flex flex-col p-4 short:p-3 md:p-4 short:md:p-3', className)}
    >
      <h2 id="attn-h" className="card-title mb-2">
        <Eye aria-hidden />
        Що потребує уваги
      </h2>
      <ul className="m-0 flex list-none flex-col divide-y divide-border p-0">
        {attention.map((it) => {
          const Icon = it.component ? ACTION_ICON[it.component] : Eye
          return (
            <li key={it.id}>
              <Link to={to(it)} title={it.hint} className={row}>
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-attention-solid" />
                <Icon aria-hidden className="size-4 shrink-0 text-text-muted" />
                <span className="min-w-0 flex-1 text-body">{it.title}</span>
                {it.component && (
                  <span className="shrink-0 rounded-full bg-neutral-bg px-2 py-0.5 text-fine text-neutral-text">
                    {COMPONENT_LABELS[it.component]}
                  </span>
                )}
                <ArrowRight
                  aria-hidden
                  className="size-4 shrink-0 text-text-muted xl:max-2xl:hidden"
                />
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="mt-3 border-t border-border pt-2 short:mt-2 short:pt-1.5">
        <p className="m-0 mb-1.5 flex items-center gap-1.5 text-caption font-semibold text-text-muted">
          <TrendingUp aria-hidden className="size-4" />
          Сильні сторони
        </p>
        <ul className="m-0 flex list-none flex-col divide-y divide-border p-0">
          {strengths.map((it) => (
            <li key={it.id}>
              <Link to={to(it)} title={it.hint} className={row}>
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-strength-solid" />
                <span className="min-w-0 flex-1 text-body">{it.title}</span>
                <ArrowRight aria-hidden className="size-4 shrink-0 text-text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
