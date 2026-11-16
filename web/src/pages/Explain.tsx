import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Info,
  Table2,
  TriangleAlert,
} from 'lucide-react'
import {
  Badge,
  Card,
  MATURITY,
  SourceMarker,
  buttonBase,
  buttonSizes,
  buttonVariants,
} from '@/components/ui'
import type { MaturityLevel } from '@/components/ui'
import { SOURCES } from '@/components/ui/config'
import { cn } from '@/lib/cn'
import { Num } from '@/components/dashboard/Num'
import { DataTable } from '@/components/dashboard/ChartFrame'
import { components, currentIndex, factItems, perceptionItems } from '@/demo/data'
import {
  MODE_LABELS,
  buildTree,
  sumCheck,
  visibleNodes,
  type ExplainMode,
  type TreeNode,
} from '@/lib/scoring/explain'
import {
  COMPONENT_IDS,
  LEVEL_UPPER_BOUNDS,
  LIMITER_MARGIN,
  fmt,
  fmtIndex,
  type ComponentId,
} from '@/lib/scoring/methodology'

const MODES: ExplainMode[] = ['perception', 'facts', 'credited']
const WEIGHT_HINT = 'Яку частку батьківського вузла становить цей вузол, у відсотках.'
const CONTRIB_HINT =
  'Скільки пунктів індексу дає цей вузол: значення, помножене на його вагу і на ваги вищих вузлів.'
const KIND_LABEL = {
  index: 'Індекс',
  component: 'Компонент',
  item: 'Питання або показник',
} as const

const pct = (n: number) => `${fmt(n)} %`
/** Внесок із двома знаками, щоб сума була видна. */
const pts = (n: number) =>
  n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function allIds(root: TreeNode): string[] {
  return [root.id, ...(root.children ?? []).flatMap(allIds)]
}

function Row({
  node,
  level,
  pos,
  size,
  expanded,
  focused,
  onToggle,
  onFocus,
}: {
  node: TreeNode
  level: number
  pos: number
  size: number
  expanded: boolean
  focused: boolean
  onToggle: () => void
  onFocus: () => void
}) {
  const hasKids = !!node.children?.length
  const Chevron = expanded ? ChevronDown : ChevronRight
  return (
    <div
      role="treeitem"
      data-node={node.id}
      aria-level={level}
      aria-posinset={pos}
      aria-setsize={size}
      aria-expanded={hasKids ? expanded : undefined}
      aria-label={`${KIND_LABEL[node.kind]}: ${node.label}. Вага ${pct(node.weight)}, значення ${fmt(node.value)}, внесок ${pts(node.contribution)} пункта${node.limited ? ', спрацював обмежувач' : ''}`}
      tabIndex={focused ? 0 : -1}
      onFocus={onFocus}
      onClick={hasKids ? onToggle : undefined}
      style={{ paddingLeft: `${(level - 1) * 1 + 0.5}rem` }}
      className={cn(
        'grid grid-cols-1 items-start gap-x-2 gap-y-1 border-b border-border py-2 pr-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_5rem]',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        hasKids && 'cursor-pointer hover:bg-surface-muted',
        node.kind === 'index' && 'bg-accent-soft font-semibold',
        node.kind === 'component' && 'bg-surface-muted/50 font-semibold',
      )}
    >
      <div className="flex min-w-0 items-start gap-1.5">
        {hasKids ? (
          <Chevron aria-hidden className="mt-0.5 size-4 shrink-0" />
        ) : (
          <span aria-hidden className="size-4 shrink-0" />
        )}
        <div className="min-w-0">
          <span className="text-body">{node.label}</span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {node.source && (
              <span className="inline-flex items-center gap-1.5 text-caption font-normal text-text-muted">
                <SourceMarker source={node.source} size={12} />
                {SOURCES[node.source].label}
              </span>
            )}
            {node.limited && node.kind === 'component' && (
              <Badge tone="attention">
                <Info aria-hidden className="size-4" />
                обмежувач
              </Badge>
            )}
            {node.limited && node.kind === 'item' && (
              <span className="text-caption font-normal text-attention-text">
                частка обмеження компонента
              </span>
            )}
          </div>
          {node.reason && (
            <p className="m-0 mt-1 text-caption font-normal text-text-muted">{node.reason}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 pl-6 font-normal sm:contents sm:pl-0">
        <span className="text-body tabular sm:text-right">
          <span className="text-caption text-text-muted sm:hidden">Вага </span>
          <Num hint={WEIGHT_HINT}>{pct(node.weight)}</Num>
        </span>
        <span className="text-body tabular sm:text-right">
          <span className="text-caption text-text-muted sm:hidden">Значення </span>
          <Num hint={node.hint}>{fmt(node.value)}</Num>
        </span>
        <span className="text-body tabular sm:text-right">
          <span className="text-caption text-text-muted sm:hidden">Внесок </span>
          <Num hint={CONTRIB_HINT}>{pts(node.contribution)}</Num>
        </span>
      </div>
    </div>
  )
}

function ExplainInner({ initial }: { initial: ComponentId | null }) {
  const limited = components.find((c) => c.credited.limited)?.id
  const [mode, setMode] = useState<ExplainMode>('credited')
  const [asTable, setAsTable] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(['index', initial ?? limited ?? 'culture']),
  )
  const [focusId, setFocusId] = useState('index')
  const treeRef = useRef<HTMLDivElement>(null)

  const root = useMemo(() => buildTree(mode, components, perceptionItems, factItems), [mode])
  const rows = visibleNodes(root, expanded)
  const total = sumCheck(root)
  const ok = total === root.value && (mode !== 'credited' || total === currentIndex)

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const moveTo = (id: string) => {
    setFocusId(id)
    treeRef.current?.querySelector<HTMLElement>(`[data-node="${id}"]`)?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>('[data-node]')?.dataset.node
    if (!id) return
    const i = rows.findIndex((r) => r.node.id === id)
    const cur = rows[i]
    if (!cur) return
    const hasKids = !!cur.node.children?.length
    const open = expanded.has(id)
    let handled = true
    switch (e.key) {
      case 'ArrowDown':
        if (rows[i + 1]) moveTo(rows[i + 1]!.node.id)
        break
      case 'ArrowUp':
        if (rows[i - 1]) moveTo(rows[i - 1]!.node.id)
        break
      case 'Home':
        moveTo(rows[0]!.node.id)
        break
      case 'End':
        moveTo(rows[rows.length - 1]!.node.id)
        break
      case 'ArrowRight':
        if (hasKids && !open) toggle(id)
        else if (hasKids && rows[i + 1]) moveTo(rows[i + 1]!.node.id)
        break
      case 'ArrowLeft':
        if (hasKids && open) toggle(id)
        else if (cur.parentId) moveTo(cur.parentId)
        break
      case 'Enter':
      case ' ':
        if (hasKids) toggle(id)
        break
      default:
        handled = false
    }
    if (handled) e.preventDefault()
  }

  const flat = useMemo(() => visibleNodes(root, new Set(allIds(root))), [root])
  const levels = [1, 2, 3, 4, 5] as MaturityLevel[]
  const bound = (l: MaturityLevel) => {
    const lo = l === 1 ? 0 : LEVEL_UPPER_BOUNDS[l - 2]!
    const hi = l === 5 ? 100 : LEVEL_UPPER_BOUNDS[l - 1]!
    return l === 1
      ? `від 0 до ${fmt(hi)}`
      : l === 5
        ? `вище ${fmt(lo)}`
        : `вище ${fmt(lo)} до ${fmt(hi)}`
  }

  return (
    <div data-ready="true" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-section">Розклад індексу</h1>
          <p className="m-0 text-caption text-text-muted">
            Звідки взялося кожне число: індекс, компоненти, питання й показники.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Що показувати"
            className="inline-flex rounded-md border border-border-strong"
          >
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  buttonBase,
                  buttonSizes.md,
                  'rounded-none first:rounded-l-md last:rounded-r-md border-0',
                  mode === m
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text hover:bg-surface-muted',
                )}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={asTable}
            onClick={() => setAsTable((v) => !v)}
            className={cn(buttonBase, buttonVariants.secondary, buttonSizes.md)}
          >
            {asTable ? (
              <BarChart3 aria-hidden className="size-4" />
            ) : (
              <Table2 aria-hidden className="size-4" />
            )}
            {asTable ? 'Показати як дерево' : 'Показати як таблицю'}
          </button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-12">
        <Card as="section" aria-labelledby="tree-h" className="p-0 md:p-0 xl:col-span-8">
          <h2 id="tree-h" className="sr-only">
            Дерево розкладу, режим «{MODE_LABELS[mode]}»
          </h2>
          <div
            aria-hidden
            className="hidden grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_4rem] gap-x-2 border-b border-border bg-surface-muted px-2 py-1.5 text-caption font-semibold sm:grid sm:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_5rem]"
          >
            <span>Вузол</span>
            <span className="text-right">Вага</span>
            <span className="text-right">Значення</span>
            <span className="text-right">Внесок</span>
          </div>
          {asTable ? (
            <div className="overflow-auto p-2">
              <DataTable
                caption={`Розклад індексу, режим «${MODE_LABELS[mode]}»`}
                head={['Вузол', 'Рівень', 'Вага, %', 'Значення', 'Внесок, пункти', 'Джерело']}
                rows={flat.map(({ node }) => [
                  node.label,
                  KIND_LABEL[node.kind],
                  fmt(node.weight),
                  fmt(node.value),
                  pts(node.contribution),
                  node.source ? SOURCES[node.source].label : node.limited ? 'обмежувач' : '',
                ])}
              />
            </div>
          ) : (
            <div
              ref={treeRef}
              role="tree"
              aria-label={`Розклад індексу, режим «${MODE_LABELS[mode]}»`}
              onKeyDown={onKeyDown}
            >
              {rows.map(({ node, level, pos, size }) => (
                <Row
                  key={node.id}
                  node={node}
                  level={level}
                  pos={pos}
                  size={size}
                  expanded={expanded.has(node.id)}
                  focused={focusId === node.id}
                  onToggle={() => toggle(node.id)}
                  onFocus={() => setFocusId(node.id)}
                />
              ))}
            </div>
          )}
          <p
            role="status"
            data-testid="sum-check"
            className={cn(
              'm-0 flex items-start gap-2 rounded-b-lg px-3 py-2 text-body font-semibold',
              ok ? 'bg-strength-bg text-strength-text' : 'bg-attention-bg text-attention-text',
            )}
          >
            {ok ? (
              <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0" />
            ) : (
              <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
            )}
            <span>
              {mode === 'credited'
                ? `Сума внесків = Індекс ${fmtIndex(total)}`
                : `Сума внесків = ${fmtIndex(total)}`}
              {mode !== 'credited' && (
                <span className="block text-caption font-normal">
                  Це середнє за режимом «{MODE_LABELS[mode]}» без обмежувача. До індексу йдуть
                  зараховані значення.
                </span>
              )}
            </span>
          </p>
        </Card>

        <Card as="aside" aria-labelledby="how-h" className="p-4 md:p-4 xl:col-span-4">
          <h2 id="how-h" className="m-0 mb-2 text-card">
            Як це рахується
          </h2>
          <ol className="m-0 flex list-decimal flex-col gap-2 pl-5 text-body">
            <li>
              Індекс це середнє трьох компонентів: Культура, Система, Підзвітність. Вага кожного
              однакова, по третині.
            </li>
            <li>
              Компонент складається з кількох питань або показників. Їхні ваги разом дають 100 %.
            </li>
            <li>
              Сприйняття це оцінки з анкет (робоча група, особовий склад, експерти). Факти це
              відсотки з обліку та рівні за анкетами.
            </li>
            <li>
              Обмежувач: оцінка не вище за факти більш ніж на один рівень, тобто на {LIMITER_MARGIN}{' '}
              пунктів. До індексу йде менше з двох значень: сприйняття або факти плюс{' '}
              {LIMITER_MARGIN}.
            </li>
            <li>
              Внесок вузла в пунктах це його значення, помножене на вагу. Внески разом дають індекс.
            </li>
          </ol>
          <h3 className="m-0 mb-1 mt-3 text-body font-semibold">Рівні зрілості за індексом</h3>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-caption">
            {levels.map((l) => (
              <li key={l} className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex size-6 items-center justify-center rounded-sm border tabular',
                    MATURITY[l].classes,
                  )}
                >
                  {l}
                </span>
                {MATURITY[l].name}: {bound(l)}
              </li>
            ))}
          </ul>
          <p className="m-0 mt-3 text-caption text-text-muted">
            Це інструмент розвитку: розклад показує, де саме можна покращити результат.{' '}
            <Link to="/" className="text-accent underline">
              Повернутися до огляду
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}

export function Explain() {
  const [params] = useSearchParams()
  const c = params.get('c')
  const initial = COMPONENT_IDS.includes(c as ComponentId) ? (c as ComponentId) : null
  return <ExplainInner key={initial ?? 'default'} initial={initial} />
}
