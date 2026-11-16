// Конфіг перевірки екранів. У наступних етапах доповнюйте ролі та маршрути.
import type { Page } from 'playwright'

export interface VerifyRoute {
  path: string
  /** Селектор «готовності»; за замовчуванням [data-ready="true"]. */
  ready?: string
}

export interface VerifyRole {
  id: string
  /** Підготовка ролі (наприклад, запис у localStorage) до відкриття маршрутів. */
  setup?: (page: Page) => Promise<void>
  routes: VerifyRoute[]
}

export const WIDTHS = [360, 768, 1280, 1920] as const

export const ROLES: VerifyRole[] = [
  {
    id: 'default',
    routes: [{ path: '/' }, { path: '/design' }],
  },
]
