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
    text: 'Розбіжність 45 пунктів. Варто звірити відповіді з підтвердженнями чек-листа.',
  },
  {
    id: 'f2',
    title: 'Чек-лист: частина пунктів без підтвердження',
    text: 'Для 4 з 12 пунктів немає документальних доказів. Варто додати їх до наступного етапу.',
  },
  {
    id: 'f3',
    title: 'Культура: відповідей від експертів менше, ніж заплановано',
    text: 'Отримано 3 з 5 очікуваних відповідей. Варто дочекатися решти або врахувати це при читанні результату.',
  },
]

export const strengths = [
  { id: 's1', title: 'Культура: відкритість до розмови про етичні питання', value: 57.5 },
  { id: 's2', title: 'Зростання індексу за два цикли поспіль', value: 13.2 },
]

export const attention = [
  { id: 'a1', title: 'Підзвітність: підтвердити факти документами', value: 35 },
  { id: 'a2', title: 'Система: зробити процедури помітнішими для особового складу', value: 45 },
  { id: 'a3', title: 'Культура: підсилити практичні приклади в навчанні', value: 40 },
]
