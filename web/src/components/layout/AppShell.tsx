import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Badge, SkipLink } from '@/components/ui'
import { CYCLE, CYCLE_DATE, INSTITUTION } from '@/demo/data'
import { NAV_ITEMS } from './nav'

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'touch-h flex items-center gap-3 rounded-md px-3 text-body no-underline',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                isActive
                  ? 'bg-accent-soft font-semibold text-accent'
                  : 'text-text hover:bg-surface-muted',
              )
            }
          >
            <Icon aria-hidden className="size-5 shrink-0" />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export function AppShell() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="min-h-screen">
      <SkipLink />
      <header data-print="hide" className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-(--shell-max) items-center gap-3 px-(--gutter) py-2">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="touch-target inline-flex items-center justify-center gap-2 rounded-md border border-border-strong px-3 text-caption xl:hidden"
          >
            {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
            <span className="hidden md:inline">Меню</span>
            <span className="sr-only md:hidden">Меню</span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-card text-text">{INSTITUTION}</p>
            <p className="m-0 truncate text-caption text-text-muted">
              Цикл оцінювання {CYCLE}, станом на {CYCLE_DATE}
            </p>
          </div>
          <Badge tone="neutral" title="Усі дані на екрані синтетичні">
            Демо
          </Badge>
        </div>
        {open && (
          <nav
            id="mobile-nav"
            aria-label="Основна навігація"
            className="border-t border-border bg-surface px-(--gutter) py-3 xl:hidden"
          >
            <NavList onNavigate={() => setOpen(false)} />
          </nav>
        )}
      </header>

      <div className="mx-auto flex max-w-(--shell-max)">
        <nav
          aria-label="Основна навігація"
          data-print="hide"
          className="sticky top-[69px] hidden h-[calc(100vh-69px)] w-60 shrink-0 border-r border-border bg-surface p-4 xl:block"
        >
          <NavList />
        </nav>
        <main
          id="main"
          tabIndex={-1}
          key={pathname}
          className="min-w-0 flex-1 px-(--gutter) py-4 md:py-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
