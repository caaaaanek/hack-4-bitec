import { cn } from '@/lib/cn'

/** Знак продукту: дуга-шкала з рисками і точкою поточного значення. Колір лише з токенів. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      focusable="false"
      className={cn('size-8 shrink-0', className)}
    >
      <rect width="32" height="32" rx="8" fill="var(--color-accent-soft)" />
      <path
        d="M7 21a10 10 0 1 1 18 0"
        fill="none"
        stroke="var(--color-text)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M16 5.6v2.4M8.4 9.4l1.7 1.7M23.6 9.4l-1.7 1.7"
        stroke="var(--color-text-muted)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="23.7"
        cy="10.2"
        r="3"
        fill="var(--color-accent)"
        stroke="var(--color-accent-soft)"
        strokeWidth="1.5"
      />
      <rect x="10" y="24" width="12" height="2.5" rx="1.25" fill="var(--color-accent)" />
    </svg>
  )
}
