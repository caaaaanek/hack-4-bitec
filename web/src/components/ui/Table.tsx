import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card } from './Card'
import { nextSortDir, sortRows, type SortDir, type SortValue } from './tableSort'

export interface TableColumn<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  numeric?: boolean
}

export interface TableProps<T> {
  columns: TableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  caption: string
  captionVisible?: boolean
  defaultSort?: { key: string; dir: SortDir }
  className?: string
}

const ariaSortOf = (dir: SortDir) =>
  dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'

const DIR_LABEL: Record<SortDir, string> = {
  asc: 'за зростанням',
  desc: 'за спаданням',
  none: 'без сортування',
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  caption,
  captionVisible = false,
  defaultSort,
  className,
}: TableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir }>(
    defaultSort ?? { key: '', dir: 'none' },
  )

  const sorted = useMemo(
    () =>
      sort.dir === 'none'
        ? rows
        : sortRows(rows, sort.key, sort.dir, (row, k) => {
            const v = (row as Record<string, unknown>)[k]
            return (typeof v === 'number' || typeof v === 'string' ? v : null) as SortValue
          }),
    [rows, sort],
  )

  const toggle = (key: string) => {
    const dir = sort.key === key ? nextSortDir(sort.dir) : 'asc'
    setSort({ key, dir })
  }

  const dirOf = (key: string): SortDir => (sort.key === key ? sort.dir : 'none')
  const cell = (col: TableColumn<T>, row: T): ReactNode =>
    col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')
  const alignClass = (col: TableColumn<T>) =>
    col.numeric || col.align === 'right'
      ? 'text-right'
      : col.align === 'center'
        ? 'text-center'
        : 'text-left'

  const sortableCols = columns.filter((c) => c.sortable)

  return (
    <div className={className}>
      {/* Вузькі ширини: сортування над списком карток */}
      {sortableCols.length > 0 && (
        <div
          role="group"
          aria-label={`Сортування: ${caption}`}
          className="mb-3 flex flex-wrap gap-2 md:hidden"
        >
          {sortableCols.map((col) => {
            const dir = dirOf(col.key)
            const Icon = dir === 'asc' ? ArrowUp : dir === 'desc' ? ArrowDown : ArrowUpDown
            return (
              <button
                key={col.key}
                type="button"
                onClick={() => toggle(col.key)}
                aria-pressed={dir !== 'none'}
                aria-label={`Сортувати: ${col.header}, ${DIR_LABEL[dir]}`}
                className={cn(
                  'touch-h inline-flex items-center gap-1 rounded-md border border-border-strong bg-surface px-3 text-caption text-text',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                  dir !== 'none' && 'font-semibold',
                )}
              >
                {col.header}
                <Icon aria-hidden className="size-4" />
              </button>
            )
          })}
        </div>
      )}

      <ul className="m-0 flex list-none flex-col gap-3 p-0 md:hidden" aria-label={caption}>
        {sorted.map((row) => (
          <li key={rowKey(row)}>
            <Card as="div" className="p-4">
              <dl className="m-0 flex flex-col gap-2">
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between gap-4">
                    <dt className="text-caption text-text-muted">{col.header}:</dt>
                    <dd
                      className={cn(
                        'm-0 text-body text-text',
                        col.numeric && 'tabular-nums text-right',
                      )}
                    >
                      {cell(col, row)}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
        <table className="hidden w-full border-collapse text-body md:table">
          <caption className={captionVisible ? 'p-3 text-left text-card text-text' : 'sr-only'}>
            {caption}
          </caption>
          <thead className="bg-surface-muted">
            <tr>
              {columns.map((col) => {
                const dir = dirOf(col.key)
                const Icon = dir === 'asc' ? ArrowUp : dir === 'desc' ? ArrowDown : ArrowUpDown
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={col.sortable ? ariaSortOf(dir) : undefined}
                    className={cn(
                      'border-b border-border px-4 py-2 text-caption font-semibold text-text',
                      alignClass(col),
                    )}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggle(col.key)}
                        className={cn(
                          'touch-h inline-flex items-center gap-1 rounded-sm font-semibold',
                          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                          (col.numeric || col.align === 'right') && 'flex-row-reverse',
                        )}
                      >
                        {col.header}
                        <Icon aria-hidden className="size-4" />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border last:border-b-0">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-text',
                      alignClass(col),
                      col.numeric && 'tabular-nums',
                    )}
                  >
                    {cell(col, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
