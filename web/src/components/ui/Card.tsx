import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type CardCategory =
  'culture' | 'system' | 'accountability' | 'neutral' | 'strength' | 'attention'

/** Тонка верхня лінія за категорією вмісту. Колір ніколи не єдиний носій: категорію називає заголовок. */
const CATEGORY_LINE: Record<CardCategory, string> = {
  culture: 'before:bg-cat-culture',
  system: 'before:bg-cat-system',
  accountability: 'before:bg-cat-accountability',
  neutral: 'before:bg-cat-neutral',
  strength: 'before:bg-strength-solid',
  attention: 'before:bg-attention-solid',
}

export interface CardProps extends HTMLAttributes<HTMLElement> {
  category?: CardCategory
  as?: ElementType
  interactive?: boolean
  className?: string
  children?: ReactNode
}

export function Card({
  as,
  category = 'neutral',
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  const Tag: ElementType = as ?? 'div'
  return (
    <Tag
      data-print="card"
      className={cn(
        'card relative bg-surface border border-border rounded-lg shadow-sm p-3 md:p-4',
        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:rounded-t-lg before:content-[""]',
        CATEGORY_LINE[category],
        interactive &&
          'transition-shadow duration-150 ease-standard hover:bg-surface-raised hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-3 flex items-start justify-between gap-3', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardTitle({
  as: Tag = 'h3',
  icon,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement> & { as?: ElementType; icon?: ReactNode }) {
  return (
    <Tag className={cn('card-title', className)} {...rest}>
      {icon}
      {children}
    </Tag>
  )
}
