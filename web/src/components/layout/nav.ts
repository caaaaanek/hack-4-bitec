import {
  ClipboardCheck,
  ClipboardList,
  FileText,
  Gauge,
  History,
  Lightbulb,
  ListTree,
  PencilLine,
  Settings,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { canAccess, type Role } from '@/lib/access'

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
  { to: '/manage', label: 'Керування циклом', icon: Settings },
  { to: '/surveys', label: 'Анкети', icon: ClipboardList },
  { to: '/checklist', label: 'Чек-лист', icon: ClipboardCheck },
  { to: '/audit', label: 'Журнал', icon: History },
  { to: '/s/demo', label: 'Пройти опитування', icon: PencilLine },
  { to: '/me', label: 'Мої результати', icon: UserRound },
]

/** Лише розділи, доступні ролі. */
export const navFor = (role: Role): NavItem[] => NAV_ITEMS.filter((i) => canAccess(role, i.to))
