import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'

export interface RadarRow {
  name: string
  current: number
  previous: number
}

const CUR = 'var(--color-accent)'
const PREV = 'var(--color-neutral-solid)'

/** Радар по трьох компонентах: поточний цикл суцільний з колом, попередній пунктирний з квадратом. */
export function ComponentsRadar({ data }: { data: RadarRow[] }) {
  return (
    <div className="h-full min-h-[200px]" aria-hidden>
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 320, height: 220 }}
      >
        <RadarChart data={data} outerRadius="68%" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 14, fill: 'var(--color-text)' }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tickCount={5}
            tick={{ fontSize: 14, fill: 'var(--color-text-muted)' }}
            axisLine={false}
          />
          <Radar
            dataKey="previous"
            stroke={PREV}
            strokeWidth={2}
            strokeDasharray="6 4"
            fill={PREV}
            fillOpacity={0.08}
            isAnimationActive={false}
            dot={({ cx = 0, cy = 0 }) => (
              <rect key={`${cx}${cy}`} x={cx - 4} y={cy - 4} width={8} height={8} fill={PREV} />
            )}
          />
          <Radar
            dataKey="current"
            stroke={CUR}
            strokeWidth={3}
            fill={CUR}
            fillOpacity={0.22}
            isAnimationActive={false}
            dot={({ cx = 0, cy = 0 }) => (
              <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={5} fill={CUR} />
            )}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RadarLegend({ current, previous }: { current: string; previous: string }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-caption">
      <li className="flex items-center gap-2">
        <svg width="28" height="12" aria-hidden>
          <line x1="0" y1="6" x2="28" y2="6" stroke={CUR} strokeWidth="3" />
          <circle cx="14" cy="6" r="5" fill={CUR} />
        </svg>
        Цикл {current}
      </li>
      <li className="flex items-center gap-2">
        <svg width="28" height="12" aria-hidden>
          <line x1="0" y1="6" x2="28" y2="6" stroke={PREV} strokeWidth="2" strokeDasharray="6 4" />
          <rect x="10" y="2" width="8" height="8" fill={PREV} />
        </svg>
        Цикл {previous}
      </li>
    </ul>
  )
}
