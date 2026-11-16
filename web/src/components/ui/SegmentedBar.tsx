import { cn } from '@/lib/cn'

/** Сегментована смуга: заповнені сегменти кольору даних, решта сірі. Значення завжди є поруч текстом. */
export function SegmentedBar({
  value,
  max = 100,
  segments = 20,
  label,
  className,
}: {
  value: number
  max?: number
  segments?: number
  /** Текстовий опис для скрінрідерів, наприклад «Культура: 58 зі 100». */
  label: string
  className?: string
}) {
  const filled = Math.round((Math.max(0, Math.min(value, max)) / max) * segments)
  return (
    <div role="img" aria-label={label} className={cn('flex h-5 gap-[3px]', className)}>
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
