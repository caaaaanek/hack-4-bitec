import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  interactive?: boolean
  className?: string
  children?: ReactNode
}

export function Card({ as, interactive = false, className, children, ...rest }: CardProps) {
  const Tag: ElementType = as ?? 'div'
  return (
    <Tag
      data-print="card"
      className={cn(
        'bg-surface border border-border rounded-lg shadow-sm p-4 md:p-6',
        interactive &&
          'transition-shadow duration-150 ease-standard hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
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
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement> & { as?: ElementType }) {
  return (
    <Tag className={cn('text-card text-text', className)} {...rest}>
      {children}
    </Tag>
  )
}
