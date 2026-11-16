import { Link } from 'react-router-dom'
import { ArrowUp, FileText, Lightbulb, ListTree } from 'lucide-react'
import { MATURITY, MaturityBadge, buttonBase, buttonSizes, buttonVariants } from '@/components/ui'
import type { MaturityLevel } from '@/components/ui'
import { cn } from '@/lib/cn'
import { COMPONENT_LABELS, fmt, fmtIndex, pointsText } from '@/lib/scoring/methodology'
import {
  attention,
  components,
  currentIndex,
  currentLevel,
  CYCLE,
  flags,
  indexDelta,
  previous,
  previousIndex,
  strengths,
  trend,
  trust,
} from '@/demo/data'
import { ChartFrame, DataTable } from '@/components/dashboard/ChartFrame'
import { Gauge } from '@/components/dashboard/Gauge'
import { ComponentsRadar, RadarLegend } from '@/components/dashboard/ComponentsRadar'
import { TrendLine } from '@/components/dashboard/TrendLine'
import { Num } from '@/components/dashboard/Num'
import {
  Conclusion,
  DevelopmentBanner,
  FlagStrip,
  InsightList,
  LimiterBlock,
  TrustCard,
} from '@/components/dashboard/Panels'

const LEVELS: MaturityLevel[] = [1, 2, 3, 4, 5]
const limited = components.find((c) => c.credited.limited)

function buildConclusion(): string {
  const parts = [
    `Заклад перебуває на рівні зрілості ${currentLevel} «${MATURITY[currentLevel].name}»: індекс доброчесності ${fmtIndex(currentIndex)} з 100, що на ${pointsText(indexDelta)} вище, ніж у попередньому циклі.`,
  ]
  if (limited) {
    parts.push(
      `Для компонента «${COMPONENT_LABELS[limited.id]}» сприйняття (${fmt(limited.perception)}) помітно вище за факти (${fmt(limited.facts)}), тому зараховано ${fmt(limited.credited.value)}.`,
    )
  }
  parts.push('Довіра до оцінки середня, тож спершу варто підтвердити факти документами.')
  return parts.join(' ')
}

const linkBtn = (variant: 'primary' | 'secondary') =>
  cn(buttonBase, buttonVariants[variant], buttonSizes.md, 'no-underline')

export function Home() {
  const radarData = components.map((c) => ({
    name: COMPONENT_LABELS[c.id],
    current: c.credited.value,
    previous: previous.credited[c.id],
  }))
  const prevCycle = previous.cycle
  const gaugeDescription = `Індекс ${fmtIndex(currentIndex)} з 100, рівень ${currentLevel} «${MATURITY[currentLevel].name}». Динаміка: ${trend.map((t) => `${t.cycle} ${fmtIndex(t.index)}`).join(', ')}.`
  const radarDescription = `Цикл ${CYCLE}: ${components.map((c) => `${COMPONENT_LABELS[c.id]} ${fmt(c.credited.value)}`).join(', ')}. Цикл ${prevCycle}: ${components.map((c) => `${COMPONENT_LABELS[c.id]} ${fmt(previous.credited[c.id])}`).join(', ')}.`

  return (
    <div data-ready="true" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-section">Огляд результатів</h1>
        <nav aria-label="Швидкі переходи" className="flex flex-wrap gap-2">
          <Link to="/explain" className={linkBtn('primary')}>
            <ListTree aria-hidden className="size-4" />
            Розклад індексу
          </Link>
          <Link to="/recommendations" className={linkBtn('secondary')}>
            <Lightbulb aria-hidden className="size-4" />
            Рекомендації
          </Link>
          <Link to="/reports" className={linkBtn('secondary')}>
            <FileText aria-hidden className="size-4" />
            Звіт
          </Link>
        </nav>
      </div>
      <DevelopmentBanner />

      <div className="grid gap-3 xl:grid-cols-12">
        <ChartFrame
          className="xl:col-span-4"
          title="Індекс доброчесності"
          subtitle="Integrity Index, 0-100"
          description={gaugeDescription}
          chart={
            <div className="flex flex-col gap-1">
              <Gauge value={currentIndex} level={currentLevel} />
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <MaturityBadge level={currentLevel} />
                <ol aria-label="Рівні зрілості" className="m-0 flex list-none gap-1.5 p-0">
                  {LEVELS.map((l) => (
                    <li
                      key={l}
                      title={`${l} ${MATURITY[l].name}`}
                      aria-current={l === currentLevel ? 'step' : undefined}
                      className={cn(
                        'flex size-8 items-center justify-center rounded-sm border text-caption tabular',
                        l === currentLevel
                          ? cn(MATURITY[l].classes, 'font-bold ring-2 ring-text')
                          : 'border-border bg-surface text-text-muted',
                      )}
                    >
                      <span className="sr-only">
                        Рівень {l}: {MATURITY[l].name}
                        {l === currentLevel ? ', поточний' : ''}
                      </span>
                      <span aria-hidden>{l}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <p className="m-0 flex flex-wrap items-center justify-center gap-x-2 text-body font-semibold text-strength-text">
                <span className="inline-flex items-center gap-1">
                  <ArrowUp aria-hidden className="size-4" />
                  <Num hint="Різниця між індексом цього циклу та попереднього, у пунктах шкали 0-100.">
                    Зросло на {pointsText(indexDelta)}
                  </Num>
                </span>
                <span className="text-caption font-normal text-text-muted">
                  (цикл {prevCycle}: {fmtIndex(previousIndex)})
                </span>
              </p>
              <TrendLine data={trend} />
            </div>
          }
          table={
            <DataTable
              caption="Індекс доброчесності за цикли оцінювання"
              head={['Цикл', 'Індекс', 'Рівень']}
              rows={[...trend]
                .reverse()
                .map((t) => [t.cycle, fmtIndex(t.index), `${levelName(t.index)}`])}
            />
          }
        />

        <ChartFrame
          className="xl:col-span-4"
          title="Компоненти індексу"
          subtitle="Зараховані значення, 0-100"
          description={radarDescription}
          chartClassName="flex flex-col"
          chart={
            <>
              <div className="min-h-[240px] flex-1">
                <ComponentsRadar data={radarData} />
              </div>
              <RadarLegend current={CYCLE} previous={prevCycle} />
            </>
          }
          table={
            <DataTable
              caption="Зараховані значення компонентів за два цикли"
              head={['Компонент', CYCLE, prevCycle, 'Зміна']}
              rows={components.map((c) => [
                COMPONENT_LABELS[c.id],
                fmt(c.credited.value),
                fmt(previous.credited[c.id]),
                `${c.credited.value - previous.credited[c.id] >= 0 ? '+' : ''}${fmt(c.credited.value - previous.credited[c.id])}`,
              ])}
            />
          }
        />

        <div className="flex flex-col gap-3 xl:col-span-4">
          <TrustCard level={trust.level} reasons={trust.reasons} />
          {limited && (
            <LimiterBlock
              label={COMPONENT_LABELS[limited.id]}
              perception={limited.perception}
              facts={limited.facts}
              credited={limited.credited.value}
              reason={limited.credited.reason}
            />
          )}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-12">
        <div className="flex flex-col *:flex-1 xl:col-span-3">
          <InsightList title="Сильні сторони" kind="strength" items={strengths} />
        </div>
        <div className="flex flex-col *:flex-1 xl:col-span-4">
          <InsightList title="Напрями, що потребують уваги" kind="attention" items={attention} />
        </div>
        <div className="flex flex-col *:flex-1 xl:col-span-5">
          <Conclusion paragraphs={buildConclusion()} />
        </div>
      </div>

      <FlagStrip flags={flags} />
    </div>
  )
}

import { levelOf } from '@/lib/scoring/methodology'
function levelName(index: number): string {
  const l = levelOf(index)
  return `${l} ${MATURITY[l].name}`
}
