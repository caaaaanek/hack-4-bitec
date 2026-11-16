import { PageTitle } from '@/components/layout/PageTitle'
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  Info,
  Table2,
  TriangleAlert,
} from 'lucide-react'
import {
  Badge,
  Card,
  SegmentedControl,
  SourceMarker,
  buttonBase,
  buttonSizes,
  buttonVariants,
} from '@/components/ui'
import { SOURCES } from '@/components/ui/config'
import { cn } from '@/lib/cn'
import { Num } from '@/components/dashboard/Num'
import { WhyPanel } from '@/components/dashboard/WhyPanel'
import { useInstitution } from '@/demo/useInstitution'
import { DataTable } from '@/components/dashboard/ChartFrame'
import {
  MODE_LABELS,
  buildTree,
  sumCheck,
  visibleNodes,
  type ExplainMode,
  type TreeNode,
} from '@/lib/scoring/explain'
import { COMPONENT_IDS, fmt, fmtIndex, type ComponentId } from '@/lib/scoring/methodology'

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
          {node.count && (
            <span className="block text-caption text-text-muted">
              {node.count.numerator} з {node.count.denominator} ({fmt(node.count.percent)}%)
            </span>
          )}
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
                Обмежувач
              </Badge>
            )}
            {node.limited && node.kind === 'item' && (
              <span className="text-caption font-normal text-attention-text">
                Частка обмеження компонента
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

function ExplainInner({ initial, nodeId }: { initial: ComponentId | null; nodeId: string | null }) {
  const inst = useInstitution()
  const { components, perceptionItems, factItems } = inst
  const currentIndex = inst.index
  const limited = components.find((c) => c.credited.limited)?.id
  const [whyOpen, setWhyOpen] = useState(false)
  const [mode, setMode] = useState<ExplainMode>(
    nodeId && factItems.some((i) => i.id === nodeId) ? 'facts' : 'credited',
  )
  const [asTable, setAsTable] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(['index', initial ?? limited ?? 'culture']),
  )
  const [focusId, setFocusId] = useState(nodeId ?? 'index')
  const treeRef = useRef<HTMLDivElement>(null)

  const root = useMemo(
    () => buildTree(mode, components, perceptionItems, factItems),
    [mode, components, perceptionItems, factItems],
  )

  useEffect(() => {
    if (nodeId)
      document.querySelector(`[data-node="${nodeId}"]`)?.scrollIntoView?.({ block: 'center' })
  }, [nodeId])
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
  return (
    <div data-ready="true" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageTitle>Розклад індексу</PageTitle>
          <p className="m-0 text-caption text-text-muted">
            Звідки взялося кожне число: індекс, компоненти, питання й показники.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWhyOpen(true)}
            className={cn(buttonBase, buttonVariants.secondary, buttonSizes.md)}
          >
            <CircleHelp aria-hidden className="size-4" />
            Як це рахується
          </button>
          <SegmentedControl
            label="Що показувати"
            value={mode}
            onChange={setMode}
            options={MODES.map((m) => ({ value: m, label: MODE_LABELS[m] }))}
          />
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

      <WhyPanel open={whyOpen} onClose={() => setWhyOpen(false)} inst={inst} />
      <div className="grid gap-3 xl:grid-cols-12">
        <Card as="section" aria-labelledby="tree-h" className="p-0 md:p-0 xl:col-span-12">
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
                  node.source ? SOURCES[node.source].label : node.limited ? 'Обмежувач' : '',
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
      </div>
    </div>
  )
}

export function Explain() {
  const [params] = useSearchParams()
  const c = params.get('c')
  const n = params.get('n')
  const inst = useInstitution()
  const items = [...inst.perceptionItems, ...inst.factItems]
  const fromNode = items.find((i) => i.id === n)?.component ?? null
  const initial = COMPONENT_IDS.includes(c as ComponentId) ? (c as ComponentId) : fromNode
  return (
    <ExplainInner
      key={`${inst.id}-${initial ?? 'default'}-${n ?? ''}`}
      initial={initial}
      nodeId={fromNode ? n : null}
    />
  )
}
