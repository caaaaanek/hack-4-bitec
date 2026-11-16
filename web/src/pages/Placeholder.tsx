import { Link } from 'react-router-dom'
import { EmptyState, buttonBase, buttonSizes, buttonVariants } from '@/components/ui'
import { cn } from '@/lib/cn'

export interface PlaceholderProps {
  title: string
  description: string
}

/** Заглушка майбутнього розділу: пояснює, що тут буде. */
export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div data-ready="true" className="space-y-4">
      <h1 className="text-title">{title}</h1>
      <EmptyState
        title="Розділ готується"
        description={description}
        action={
          <Link
            to="/"
            className={cn(buttonBase, buttonVariants.secondary, buttonSizes.md, 'no-underline')}
          >
            Повернутися до огляду
          </Link>
        }
      />
    </div>
  )
}
