import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUp,
  FileText,
  Gauge as GaugeIcon,
  Info,
  Lightbulb,
  ListTree,
  Radar as RadarIcon,
  TrendingUp,
} from 'lucide-react'
import {
  Card,
  MATURITY,
  MaturityBadge,
  Tabs,
  Tooltip,
  buttonBase,
  buttonSizes,
  buttonVariants,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { TRUST_GRADE_TEXT } from '@/components/ui/messages'
import {
  COMPONENT_LABELS,
  fmt,
  fmtIndex,
  levelOf,
  pointsText,
  scoreText,
} from '@/lib/scoring/methodology'
import {
  attention,
  components,
  currentIndex,
  currentLevel,
  CYCLE,
  CYCLE_DATE,
  indexDelta,
  previous,
  previousIndex,
  strengths,
  trend,
  trustSummary,
  summaryReason,
} from '@/demo/data'
import { ChartView, DataTable } from '@/components/dashboard/ChartFrame'
import { Gauge } from '@/components/dashboard/Gauge'
import { MaturitySteps } from '@/components/dashboard/MaturitySteps'
import { ComponentsRadar, RadarLegend } from '@/components/dashboard/ComponentsRadar'
import { TrendLine } from '@/components/dashboard/TrendLine'
import { Num } from '@/components/dashboard/Num'
import {
  AttentionPanel,
  ComponentsCard,
  TrustPanel,
  type ComponentRow,
} from '@/components/dashboard/Panels'

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
  const t = TRUST_GRADE_TEXT[trustSummary.grade]
  parts.push(
    trustSummary.grade === 'A'
      ? `Достовірність ${t.letter}: ${t.word.toLowerCase()}.`
      : `Достовірність ${t.letter}: ${t.word.toLowerCase()}, тож спершу варто підтвердити факти документами.`,
  )
  return parts.join(' ')
}

const linkBtn = (variant: 'primary' | 'secondary') =>
  cn(buttonBase, buttonVariants[variant], buttonSizes.md, 'no-underline')

/** Висновок: два рядки, решта за кнопкою. Повний текст завжди в DOM для скрінрідерів. */
function ConclusionText({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div>
      <p id={id} className={cn('m-0 text-body', !open && 'line-clamp-2')}>
        {text}
      </p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="touch-h mt-1 rounded-sm text-body font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {open ? 'Згорнути' : 'Читати повністю'}
      </button>
    </div>
  )
}

export function Home() {
  const [view, setView] = useState('radar')
  const radarData = components.map((c) => ({
    name: COMPONENT_LABELS[c.id],
    current: c.credited.value,
    previous: previous.credited[c.id],
  }))
  const rows: ComponentRow[] = components.map((c) => ({
    id: c.id,
    value: c.credited.value,
    level: levelOf(c.credited.value),
    delta: Math.round((c.credited.value - previous.credited[c.id]) * 10) / 10,
    limitedHint: c.credited.limited
      ? `Сприйняття ${fmt(c.perception)}, факти ${fmt(c.facts)}, зараховано ${fmt(c.credited.value)}`
      : undefined,
  }))
  const prevCycle = previous.cycle
  const gaugeDescription = `Індекс ${fmtIndex(currentIndex)} з 100, рівень ${currentLevel} «${MATURITY[currentLevel].name}». Динаміка: ${trend.map((t) => `${t.cycle} ${fmtIndex(t.index)}`).join(', ')}.`
  const radarDescription = `Цикл ${CYCLE}: ${components.map((c) => `${COMPONENT_LABELS[c.id]} ${fmt(c.credited.value)}`).join(', ')}. Цикл ${prevCycle}: ${components.map((c) => `${COMPONENT_LABELS[c.id]} ${fmt(previous.credited[c.id])}`).join(', ')}.`

  return (
    <div data-ready="true" className="flex flex-col gap-3 short:gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 text-title short:text-section">Огляд закладу</h1>
          <p className="sr-only" data-testid="summary">
            {scoreText(currentIndex)}, {MATURITY[currentLevel].name}, достовірність{' '}
            {TRUST_GRADE_TEXT[trustSummary.grade].letter}
          </p>
        </div>
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

      <div className="grid gap-4 short:gap-3 xl:grid-cols-12">
        <Card
          as="section"
          aria-labelledby="idx-h"
          className="flex flex-col p-4 short:p-3 md:p-5 short:md:p-3 xl:order-1 xl:col-span-7"
        >
          <h2 id="idx-h" className="card-title">
            <GaugeIcon aria-hidden />
            Індекс доброчесності
          </h2>
          <p className="sr-only">{gaugeDescription}</p>
          <div className="mt-2 grid items-center gap-3 md:grid-cols-[minmax(0,17rem)_1fr] md:gap-6">
            <Gauge value={currentIndex} level={currentLevel} />
            <div className="flex flex-col gap-3 short:gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <MaturityBadge level={currentLevel} />
                <MaturitySteps level={currentLevel} />
              </div>
              <p className="m-0 flex flex-wrap items-center gap-x-2 text-body font-semibold text-strength-text">
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
              <ConclusionText text={buildConclusion()} />
              <p className="m-0 flex items-center gap-1.5 text-caption text-text-muted">
                Дані станом на {CYCLE_DATE} · цикл {CYCLE}
                <Tooltip content="Цикл оцінювання: один повний раунд опитування й збору фактів. Індекс порівнюється з попереднім циклом.">
                  <span role="img" aria-label="Що таке цикл оцінювання" className="inline-flex">
                    <Info aria-hidden className="size-4" />
                  </span>
                </Tooltip>
              </p>
            </div>
          </div>
        </Card>

        <ComponentsCard rows={rows} className="xl:order-2 xl:col-span-5" />

        <TrustPanel
          grade={trustSummary.grade}
          raised={trustSummary.raised}
          reason={summaryReason}
          className="xl:order-4 xl:col-span-3"
        />

        <AttentionPanel
          attention={attention}
          strengths={strengths}
          className="xl:order-5 xl:col-span-4"
        />

        <Card
          as="section"
          aria-labelledby="viz-h"
          className="flex flex-col p-4 short:p-3 md:p-4 short:md:p-3 xl:order-3 xl:col-span-5"
        >
          <h2 id="viz-h" className="card-title mb-1">
            {view === 'radar' ? <RadarIcon aria-hidden /> : <TrendingUp aria-hidden />}
            {view === 'radar' ? 'Радар компонентів' : 'Динаміка індексу'}
          </h2>
          <Tabs
            aria-label="Вигляд графіка"
            value={view}
            onValueChange={setView}
            className="[&_[role=tabpanel]]:pt-2"
            items={[
              {
                id: 'radar',
                label: 'Радар',
                content: (
                  <ChartView
                    description={radarDescription}
                    chart={
                      <>
                        <div className="h-[210px] short:h-[175px]">
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
                ),
              },
              {
                id: 'trend',
                label: 'Динаміка',
                content: (
                  <ChartView
                    description={gaugeDescription}
                    chart={<TrendLine data={trend} className="h-[210px] short:h-[175px]" />}
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
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  )
}

function levelName(index: number): string {
  const l = levelOf(index)
  return `${l} ${MATURITY[l].name}`
}
