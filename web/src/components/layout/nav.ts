import { FileText, Gauge, Lightbulb, ListTree, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Огляд', icon: Gauge, end: true },
  { to: '/explain', label: 'Розклад індексу', icon: ListTree },
  { to: '/recommendations', label: 'Рекомендації', icon: Lightbulb },
  { to: '/reports', label: 'Звіт', icon: FileText },
]
