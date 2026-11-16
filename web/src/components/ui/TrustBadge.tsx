import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react'
import { cn } from '@/lib/cn'
import { badgeBase } from './Badge'
import type { TrustLevel } from './config'

const MAP = {
  high: { label: 'Висока', icon: ShieldCheck, classes: 'bg-strength-bg text-strength-text' },
  medium: { label: 'Середня', icon: Shield, classes: 'bg-attention-bg text-attention-text' },
  low: { label: 'Низька', icon: ShieldAlert, classes: 'bg-neutral-bg text-neutral-text' },
} as const

export function TrustBadge({ level, className }: { level: TrustLevel; className?: string }) {
  const { label, icon: Icon, classes } = MAP[level]
  return (
    <span className={cn(badgeBase, classes, className)} data-trust={level}>
      <Icon aria-hidden className="size-4 shrink-0" />
      <span className="sr-only">Довіра до даних: </span>
      {label}
    </span>
  )
}
