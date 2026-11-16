/** Синтетичні демо-дані. Жодних реальних людей чи закладів. */
import {
  COMPONENT_IDS,
  creditedOf,
  deltaOf,
  indexOf,
  levelOf,
  type ComponentId,
  type Credited,
} from '@/lib/scoring/methodology'
import type { TrustLevel } from '@/components/ui/config'

export const INSTITUTION = 'Умовний військовий інститут «Альфа»'
export const CYCLE = '2026-11'
export const CYCLE_DATE = '16.11.2026'

const RAW: Record<ComponentId, { perception: number; facts: number }> = {
  culture: { perception: 57.5, facts: 40 },
  system: { perception: 45, facts: 55 },
  accountability: { perception: 80, facts: 35 },
}

export interface ComponentResult {
  id: ComponentId
  perception: number
  facts: number
  credited: Credited
}

export const components: ComponentResult[] = COMPONENT_IDS.map((id) => ({
  id,
  ...RAW[id],
  credited: creditedOf(RAW[id].perception, RAW[id].facts),
}))

export const currentCredited = Object.fromEntries(
  components.map((c) => [c.id, c.credited.value]),
) as Record<ComponentId, number>

export const currentIndex = indexOf(currentCredited)
export const currentLevel = levelOf(currentIndex)

/** Попередні цикли: лише зараховані значення компонентів. */
export const history: { cycle: string; credited: Record<ComponentId, number> }[] = [
  { cycle: '2025-12', credited: { culture: 44, system: 36, accountability: 43 } },
  { cycle: '2026-06', credited: { culture: 50, system: 41, accountability: 50 } },
]

export const previous = history[history.length - 1]!
export const previousIndex = indexOf(previous.credited)
export const indexDelta = deltaOf(currentIndex, previousIndex)

export const trend = [
  ...history.map((h) => ({ cycle: h.cycle, index: indexOf(h.credited) })),
  { cycle: CYCLE, index: currentIndex },
]

export const trust: { level: TrustLevel; reasons: string[] } = {
  level: 'medium',
  reasons: [
    'У Підзвітності сприйняття (80) помітно вище за факти (35).',
    'Частина чек-листа ще не підтверджена документами.',
  ],
}

export const flags = [
  {
    id: 'f1',
    title: 'Підзвітність: сприйняття значно вище за факти',
    text: 'Розбіжність 45 пунктів. Варто звірити з чек-листом.',
  },
  {
    id: 'f2',
    title: 'Чек-лист: частина пунктів без підтвердження',
    text: '4 з 12 пунктів без документів. Варто додати докази.',
  },
  {
    id: 'f3',
    title: 'Культура: мало відповідей від експертів',
    text: 'Отримано 3 з 5 очікуваних. Варто дочекатися решти.',
  },
]

export const strengths = [
  {
    id: 's1',
    title: 'Культура: відкритість до етичних питань',
    value: 57.5,
    hint: 'Зараховане значення компонента Культура, 0-100.',
  },
  {
    id: 's2',
    title: 'Зростання індексу два цикли поспіль',
    value: 13.2,
    hint: 'Сумарне зростання індексу з циклу 2025-12, у пунктах.',
  },
]

export const attention = [
  {
    id: 'a1',
    title: 'Підзвітність: підтвердити факти',
    value: 35,
    hint: 'Факти за компонентом Підзвітність, 0-100.',
  },
  {
    id: 'a2',
    title: 'Система: зробити процедури помітнішими',
    value: 45,
    hint: 'Зараховане значення компонента Система, 0-100.',
  },
  {
    id: 'a3',
    title: 'Культура: більше практичних прикладів',
    value: 40,
    hint: 'Факти за компонентом Культура, 0-100.',
  },
]
