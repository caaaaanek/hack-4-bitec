import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Badge, SkipLink } from '@/components/ui'
import { CYCLE, CYCLE_DATE, INSTITUTION } from '@/demo/data'
import { NAV_ITEMS } from './nav'

/** compact: на ширинах 1280-1535 меню згорнуте в іконки (розгортається кнопкою). */
function NavList({ onNavigate, expanded = true }: { onNavigate?: () => void; expanded?: boolean }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            aria-label={label}
            title={label}
            className={({ isActive }) =>
              cn(
                'touch-h flex items-center gap-3 rounded-md px-3 text-body no-underline',
                !expanded && 'justify-center 2xl:justify-start',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                isActive
                  ? 'bg-accent-soft font-semibold text-accent'
                  : 'text-text hover:bg-surface-muted',
              )
            }
          >
            <Icon aria-hidden className="size-5 shrink-0" />
            <span className={cn(!expanded && 'hidden 2xl:inline')}>{label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export function AppShell() {
  const [open, setOpen] = useState(false)
  const [wide, setWide] = useState(false)
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
        <div className="mx-auto flex max-w-(--shell-max) items-center gap-3 px-(--gutter) py-2 short:py-1">
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
          <div className="min-w-0 flex-1 short:flex short:items-baseline short:gap-3">
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
          className={cn(
            'sticky top-[69px] short:top-[49px] hidden h-[calc(100vh-69px)] short:h-[calc(100vh-49px)] shrink-0 border-r border-border bg-surface p-3 xl:flex xl:flex-col xl:gap-2',
            wide ? 'w-60' : 'w-[4.5rem] 2xl:w-60',
          )}
        >
          <NavList expanded={wide} />
          <button
            type="button"
            aria-expanded={wide}
            aria-label={wide ? 'Згорнути меню' : 'Розгорнути меню'}
            title={wide ? 'Згорнути меню' : 'Розгорнути меню'}
            onClick={() => setWide((v) => !v)}
            className="touch-h mt-auto inline-flex items-center justify-center gap-2 rounded-md border border-border text-caption text-text-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus 2xl:hidden"
          >
            {wide ? (
              <PanelLeftClose aria-hidden className="size-5" />
            ) : (
              <PanelLeftOpen aria-hidden className="size-5" />
            )}
            {wide && <span>Згорнути</span>}
          </button>
        </nav>
        <main
          id="main"
          tabIndex={-1}
          key={pathname}
          className="min-w-0 flex-1 px-(--gutter) py-3 md:py-4"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
