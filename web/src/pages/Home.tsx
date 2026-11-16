import { Link } from 'react-router-dom'
import { ArrowUp, FileText, Lightbulb, ListTree } from 'lucide-react'
import { MATURITY, MaturityBadge, buttonBase, buttonSizes, buttonVariants } from '@/components/ui'
import type { MaturityLevel } from '@/components/ui'
import { cn } from '@/lib/cn'
import { COMPONENT_LABELS, fmt, pointsText } from '@/lib/scoring/methodology'
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
const best = [...components].sort((a, b) => b.credited.value - a.credited.value)[0]!

function buildConclusion(): string {
  const parts = [
    `Заклад перебуває на рівні зрілості ${currentLevel} «${MATURITY[currentLevel].name}»: індекс доброчесності ${fmt(currentIndex)} з 100, що на ${pointsText(indexDelta)} вище, ніж у попередньому циклі.`,
    `Найвищий результат у компоненті «${COMPONENT_LABELS[best.id]}» (${fmt(best.credited.value)}).`,
  ]
  if (limited) {
    parts.push(
      `Для компонента «${COMPONENT_LABELS[limited.id]}» сприйняття (${fmt(limited.perception)}) помітно вище за факти (${fmt(limited.facts)}), тому зараховано ${fmt(limited.credited.value)}.`,
    )
  }
  parts.push(
    `Довіра до оцінки середня, тож варто спершу підтвердити факти документами. Далі зручно перейти до рекомендацій.`,
  )
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
  const gaugeDescription = `Індекс ${fmt(currentIndex)} з 100, рівень ${currentLevel} «${MATURITY[currentLevel].name}». Межі рівнів: 12,5, 37,5, 62,5 і 87,5. Динаміка за три цикли: ${trend.map((t) => `${t.cycle}: ${fmt(t.index)}`).join(', ')}.`
  const radarDescription = `Зараховано в циклі ${CYCLE}: ${components.map((c) => `${COMPONENT_LABELS[c.id]} ${fmt(c.credited.value)}`).join(', ')}. У циклі ${prevCycle}: ${components.map((c) => `${COMPONENT_LABELS[c.id]} ${fmt(previous.credited[c.id])}`).join(', ')}.`

  return (
    <div data-ready="true" className="flex flex-col gap-4">
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

      <div className="grid gap-4 xl:grid-cols-12">
        <ChartFrame
          className="xl:col-span-4"
          title="Індекс доброчесності"
          subtitle="Integrity Index, 0-100"
          description={gaugeDescription}
          chart={
            <div className="flex flex-col gap-1">
              <Gauge value={currentIndex} level={currentLevel} />
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <MaturityBadge level={currentLevel} />
                <p className="m-0 flex items-center gap-1 text-body font-semibold text-strength-text">
                  <ArrowUp aria-hidden className="size-4" />
                  <Num hint="Різниця між індексом цього циклу та попереднього, у пунктах шкали 0-100.">
                    Зросло на {pointsText(indexDelta)}
                  </Num>
                </p>
              </div>
              <p className="m-0 text-center text-caption text-text-muted">
                Попередній цикл {prevCycle}: {fmt(previousIndex)}
              </p>
              <ol
                aria-label="Рівні зрілості"
                className="m-0 flex list-none justify-center gap-1.5 p-0"
              >
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
              <TrendLine data={trend} />
            </div>
          }
          table={
            <DataTable
              caption="Індекс доброчесності за цикли оцінювання"
              head={['Цикл', 'Індекс', 'Рівень']}
              rows={[...trend]
                .reverse()
                .map((t) => [t.cycle, fmt(t.index), `${levelName(t.index)}`])}
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

        <div className="flex flex-col gap-4 xl:col-span-4">
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

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <InsightList title="Сильні сторони" kind="strength" items={strengths} />
        </div>
        <div className="xl:col-span-4">
          <InsightList title="Напрями, що потребують уваги" kind="attention" items={attention} />
        </div>
        <div className="xl:col-span-4">
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
