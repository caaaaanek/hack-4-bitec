import { LEVEL_UPPER_BOUNDS, fmt } from '@/lib/scoring/methodology'
import { MATURITY, type MaturityLevel } from '@/components/ui/config'

const CX = 160
const CY = 150
const R = 112
const W = 26
const BOUNDS = [0, ...LEVEL_UPPER_BOUNDS, 100]

const pt = (v: number, r: number) => {
  const a = Math.PI * (1 - v / 100)
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)] as const
}
const arc = (v0: number, v1: number) => {
  const [x0, y0] = pt(v0, R)
  const [x1, y1] = pt(v1, R)
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

/** Gauge 0-100: п'ять рівнів зрілості, межі підписано, маркер значення. */
export function Gauge({ value, level }: { value: number; level: MaturityLevel }) {
  const [nx0, ny0] = pt(value, R - W / 2 - 5)
  const [nx1, ny1] = pt(value, R + W / 2 + 5)
  return (
    <svg
      viewBox="0 0 320 188"
      className="mx-auto block h-auto w-full max-w-[340px]"
      aria-hidden
      focusable="false"
    >
      {BOUNDS.slice(0, -1).map((b, i) => {
        const lv = (i + 1) as MaturityLevel
        const [tx, ty] = pt((b + BOUNDS[i + 1]!) / 2, R)
        const dark = lv >= 4
        return (
          <g key={lv}>
            <path
              d={arc(b, BOUNDS[i + 1]!)}
              fill="none"
              strokeWidth={W}
              stroke={`var(--color-maturity-${lv}-chart)`}
              opacity={lv === level ? 1 : 0.55}
            />
            <text
              x={tx}
              y={ty + 5}
              textAnchor="middle"
              fontSize="15"
              fontWeight="700"
              fill={dark || lv === 3 ? '#fff' : 'var(--color-text)'}
            >
              {lv}
            </text>
          </g>
        )
      })}
      {/* Межі рівнів: розділювачі й підписи значень */}
      {BOUNDS.slice(1, -1).map((b) => {
        const [x0, y0] = pt(b, R - W / 2 - 1)
        const [x1, y1] = pt(b, R + W / 2 + 1)
        const [lx, ly] = pt(b, R + W / 2 + 14)
        return (
          <g key={b}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--color-surface)" strokeWidth="3" />
            <text
              x={lx}
              y={ly + 5}
              textAnchor="middle"
              fontSize="14"
              fill="var(--color-text-muted)"
            >
              {fmt(b)}
            </text>
          </g>
        )
      })}
      <text x={CX - R} y={CY + 24} textAnchor="middle" fontSize="14" fill="var(--color-text-muted)">
        0
      </text>
      <text x={CX + R} y={CY + 24} textAnchor="middle" fontSize="14" fill="var(--color-text-muted)">
        100
      </text>
      <line
        x1={nx0}
        y1={ny0}
        x2={nx1}
        y2={ny1}
        stroke="var(--color-text)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <text
        x={CX}
        y={CY - 18}
        textAnchor="middle"
        fontSize="56"
        fontWeight="700"
        letterSpacing="-1"
        fill="var(--color-text)"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {fmt(value)}
      </text>
      <text x={CX} y={CY + 6} textAnchor="middle" fontSize="15" fill="var(--color-text-muted)">
        з 100
      </text>
      <title>{`Індекс доброчесності ${fmt(value)} з 100, рівень ${level} ${MATURITY[level].name}`}</title>
    </svg>
  )
}
