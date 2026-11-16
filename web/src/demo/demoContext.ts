import { createContext, useContext } from 'react'
import type { Role } from '@/lib/access'

export interface DemoState {
  role: Role
  /** Демо-підрозділ респондента. */
  unitId: string
  /** Поточний scope (вузол структури). Скидається на доступний при зміні ролі. */
  scope: string
  setRole: (role: Role) => void
  setUnitId: (unitId: string) => void
  resetDemo: () => void
}

export const DemoContext = createContext<DemoState | null>(null)

export function useDemo(): DemoState {
  const v = useContext(DemoContext)
  if (!v) throw new Error('useDemo потребує DemoProvider')
  return v
}

/** Демо-підрозділи респондента. */
export const DEMO_UNITS = [
  { id: 'unit-a', label: 'Підрозділ А', note: '12 відповідей: результати видно' },
  { id: 'unit-b', label: 'Підрозділ Б', note: '3 відповіді: показ прихованої групи' },
] as const
