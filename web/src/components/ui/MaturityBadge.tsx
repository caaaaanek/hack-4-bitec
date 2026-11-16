import { cn } from '@/lib/cn'
import { MATURITY, type MaturityLevel } from './config'

/** Цифра + назва + колір + візерунок (у друці). */
export function MaturityBadge({ level, className }: { level: MaturityLevel; className?: string }) {
  const { name, classes } = MATURITY[level]
  return (
    <span
      data-maturity={level}
      style={{ backgroundImage: `var(--pattern-maturity-${level})` }}
      className={cn(
        'inline-flex items-center gap-2 rounded-sm border px-2 py-0.5 text-fine whitespace-nowrap tabular',
        classes,
        className,
      )}
    >
      <span aria-hidden className="font-bold">
        {level}
      </span>
      <span className="sr-only">Рівень зрілості {level}: </span>
      {name}
    </span>
  )
}
