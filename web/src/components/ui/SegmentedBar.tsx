import { cn } from '@/lib/cn'

/** Сегментована смуга: заповнені сегменти кольору даних, решта сірі. Значення завжди є поруч текстом. */
export function SegmentedBar({
  value,
  max = 100,
  segments = 20,
  label,
  meter = false,
  className,
}: {
  value: number
  max?: number
  segments?: number
  /** Текстовий опис для скрінрідерів, наприклад «Культура: 58 зі 100». */
  label: string
  /** true: семантика role="meter" (значення в межах 0-max), інакше зображення з підписом. */
  meter?: boolean
  className?: string
}) {
  const filled = Math.round((Math.max(0, Math.min(value, max)) / max) * segments)
  return (
    <div
      role={meter ? 'meter' : 'img'}
      aria-label={label}
      aria-valuemin={meter ? 0 : undefined}
      aria-valuemax={meter ? max : undefined}
      aria-valuenow={meter ? value : undefined}
      className={cn('flex h-5 gap-[3px]', className)}
    >
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn('flex-1 rounded-[2px]', i < filled ? 'bg-data' : 'bg-surface-muted')}
        />
      ))}
    </div>
  )
}
