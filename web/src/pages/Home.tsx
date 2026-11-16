import { PageTitle } from '@/components/layout/PageTitle'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  CircleHelp,
  FileText,
  Gauge as GaugeIcon,
  Info,
  Lightbulb,
  Minus,
  Radar as RadarIcon,
  SearchCheck,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import {
  Card,
  MATURITY,
  MaturityBadge,
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
import { directionOf } from '@/lib/trends'
import { canAccess } from '@/lib/access'
import { measureSummary } from '@/lib/measures'
import { allMeasures } from '@/lib/decisions'
import { CYCLE, CYCLE_DATE } from '@/demo/data'
import { DEMO_MEASURES, TODAY } from '@/demo/measures'
import { useDecisions } from '@/demo/decisionsStore'
import { useDemoOptional } from '@/demo/demoContext'
import { useInstitution } from '@/demo/useInstitution'
import { ChartFrame, DataTable } from '@/components/dashboard/ChartFrame'
import { Gauge } from '@/components/dashboard/Gauge'
import { ComponentsRadar, RadarLegend } from '@/components/dashboard/ComponentsRadar'
import { DynamicsPanel } from '@/components/dashboard/DynamicsChart'
import { KpiRow } from '@/components/dashboard/KpiRow'
import { Num } from '@/components/dashboard/Num'
import { WhyPanel, type WhySection } from '@/components/dashboard/WhyPanel'
import { AttentionPanel, ComponentsCard, type ComponentRow } from '@/components/dashboard/Panels'

const linkBtn = (variant: 'primary' | 'secondary') =>
  cn(buttonBase, buttonVariants[variant], buttonSizes.md, 'no-underline')

const TRUST_CHIP: Record<string, { cls: string; icon: LucideIcon }> = {
  A: { cls: 'bg-strength-bg text-strength-text', icon: ShieldCheck },
  B: { cls: 'bg-attention-bg text-attention-text', icon: SearchCheck },
  C: { cls: 'bg-attention-bg text-attention-text', icon: SearchCheck },
  insufficient: { cls: 'bg-neutral-bg text-neutral-text', icon: Info },
}

export function Home() {
  const inst = useInstitution()
  const { role } = useDemoOptional()
  const decisions = useDecisions()
  const [why, setWhy] = useState<{ open: boolean; section: WhySection }>({
    open: false,
    section: 'top',
  })
  const openWhy = (section: WhySection = 'top') => setWhy({ open: true, section })

  const { components, series } = inst
  const cur = series[series.length - 1]!
  const prev = series[series.length - 2]!
  const level = levelOf(inst.index)
  const dir = directionOf(inst.delta)
  const grade = inst.trust.grade
  const t = TRUST_GRADE_TEXT[grade]
  const trust = TRUST_CHIP[grade]!
  const TrustIcon = trust.icon
  const DeltaIcon = dir === 'up' ? ArrowUp : dir === 'down' ? ArrowDown : Minus
  const deltaText =
    dir === 'same'
      ? 'Без змін'
      : `${dir === 'up' ? 'Зросло' : 'Знизилось'} на ${pointsText(inst.delta)}`
  const measures = measureSummary(allMeasures(DEMO_MEASURES, decisions), TODAY)

  const radarData = components.map((c) => ({
    name: COMPONENT_LABELS[c.id],
    current: c.credited.value,
    previous: prev.components[c.id],
  }))
  const rows: ComponentRow[] = components.map((c) => ({
    id: c.id,
    value: c.credited.value,
    level: levelOf(c.credited.value),
    delta: Math.round((c.credited.value - prev.components[c.id]) * 10) / 10,
    limitedHint: c.credited.limited
      ? `Сприйняття ${fmt(c.perception)}, факти ${fmt(c.facts)}, зараховано ${fmt(c.credited.value)}`
      : undefined,
  }))
  const gaugeDescription = `Індекс ${fmtIndex(inst.index)} з 100, рівень ${level} «${MATURITY[level].name}». Динаміка: ${series.map((p) => `${p.cycle} ${fmtIndex(p.index)}`).join(', ')}.`
  const radarDescription = `Цикл ${cur.cycle}: ${components.map((c) => `${COMPONENT_LABELS[c.id]} ${fmt(c.credited.value)}`).join(', ')}. Цикл ${prev.cycle}: ${components.map((c) => `${COMPONENT_LABELS[c.id]} ${fmt(prev.components[c.id])}`).join(', ')}.`

  return (
    <div data-ready="true" className="flex flex-col gap-3 short:gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PageTitle>Огляд закладу</PageTitle>
          <p className="sr-only" data-testid="summary">
            {scoreText(inst.index)}, {MATURITY[level].name}, достовірність {t.letter}
          </p>
        </div>
      </div>

      <KpiRow
        index={fmtIndex(inst.index)}
        level={`Рівень ${level}: ${MATURITY[level].name}`}
        deltaText={deltaText}
        deltaDir={dir}
        trustLetter={t.letter}
        trustWord={t.word}
        flagCount={inst.trust.raised.length}
        attentionCount={inst.attention.length}
        measuresTotal={measures.total}
        measuresOverdue={measures.overdue}
        onOpenFlags={() => openWhy('flags')}
        trackerHref={canAccess(role, '/tracker') ? '/tracker' : null}
      />

      <div className="grid gap-3 xl:grid-cols-12 short:gap-2">
        <Card
          as="section"
          aria-labelledby="idx-h"
          className="flex flex-col p-4 short:p-3 xl:col-span-5"
        >
          <h2 id="idx-h" className="card-title">
            <GaugeIcon aria-hidden />
            Індекс доброчесності
          </h2>
          <p className="m-0 text-caption text-text-muted">{inst.name}</p>
          <p className="sr-only">{gaugeDescription}</p>
          <div className="mt-1 flex flex-1 flex-col justify-center gap-2 short:gap-1">
            <Gauge value={inst.index} level={level} />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <MaturityBadge level={level} />
              <Tooltip content={t.rule}>
                <span
                  data-trust={grade}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-fine whitespace-nowrap',
                    trust.cls,
                  )}
                >
                  <TrustIcon aria-hidden className="size-3.5" />
                  <span aria-hidden className="font-bold">
                    {t.letter}
                  </span>
                  <span className="sr-only">Достовірність {t.letter}: </span>
                  {t.word}
                </span>
              </Tooltip>
              <Num hint="Різниця між індексом цього циклу та попереднього, у пунктах шкали 0-100.">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-fine whitespace-nowrap',
                    dir === 'up' && 'bg-strength-bg text-strength-text',
                    dir === 'down' && 'bg-attention-bg text-attention-text',
                    dir === 'same' && 'bg-neutral-bg text-neutral-text',
                  )}
                >
                  <DeltaIcon aria-hidden className="size-3.5" />
                  {deltaText}
                </span>
              </Num>
            </div>
            <p className="m-0 text-center text-body">{inst.summaryReason}</p>
          </div>
          <p className="m-0 mt-2 flex items-center justify-center gap-1.5 text-caption text-text-muted">
            Дані станом на {CYCLE_DATE} · цикл {CYCLE}
            <Tooltip content="Цикл оцінювання: один повний раунд опитування й збору фактів. Індекс порівнюється з попереднім циклом.">
              <span role="img" aria-label="Що таке цикл оцінювання" className="inline-flex">
                <Info aria-hidden className="size-4" />
              </span>
            </Tooltip>
          </p>
          <nav aria-label="Швидкі переходи" className="mt-3 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => openWhy()} className={linkBtn('primary')}>
              <CircleHelp aria-hidden className="size-4" />
              Чому такий індекс
            </button>
            {canAccess(role, '/recommendations') && (
              <Link to="/recommendations" className={linkBtn('secondary')}>
                <Lightbulb aria-hidden className="size-4" />
                Рекомендації
              </Link>
            )}
            {canAccess(role, '/reports') && (
              <Link to="/reports" className={linkBtn('secondary')}>
                <FileText aria-hidden className="size-4" />
                Звіт
              </Link>
            )}
          </nav>
        </Card>

        <DynamicsPanel
          series={series}
          events={inst.events}
          moreHref="/trends"
          chartClassName="h-[250px] short:h-[200px] xl:h-[250px]"
          className="xl:col-span-7"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-12 short:gap-2">
        <ComponentsCard rows={rows} className="xl:col-span-4" />
        <AttentionPanel
          attention={inst.attention}
          strengths={inst.strengths}
          className="xl:col-span-4"
        />
        <ChartFrame
          title="Радар компонентів"
          icon={<RadarIcon aria-hidden />}
          description={radarDescription}
          chartClassName="flex flex-col"
          className="xl:col-span-4"
          chart={
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-[200px] flex-1 short:min-h-[170px]">
                <ComponentsRadar data={radarData} />
              </div>
              <RadarLegend current={cur.cycle} previous={prev.cycle} />
            </div>
          }
          table={
            <DataTable
              caption="Зараховані значення компонентів за два цикли"
              head={['Компонент', cur.cycle, prev.cycle, 'Зміна']}
              rows={components.map((c) => {
                const d = Math.round((c.credited.value - prev.components[c.id]) * 10) / 10
                return [
                  COMPONENT_LABELS[c.id],
                  fmt(c.credited.value),
                  fmt(prev.components[c.id]),
                  `${d >= 0 ? '+' : ''}${fmt(d)}`,
                ]
              })}
            />
          }
        />
      </div>

      <WhyPanel
        open={why.open}
        section={why.section}
        onClose={() => setWhy((w) => ({ ...w, open: false }))}
        inst={inst}
      />
    </div>
  )
}
