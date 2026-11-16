import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ForbiddenState, Logo, SkipLink } from '@/components/ui'
import { CYCLE, CYCLE_DATE, INSTITUTION } from '@/demo/data'
import { canAccess, defaultRoute, isKnownRoute, type Role } from '@/lib/access'
import { useDemo } from '@/demo/demoContext'
import { HeaderActions } from './HeaderActions'
import { NAV_ITEMS, navFor } from './nav'

/** compact: на ширинах 1280-1535 меню згорнуте в іконки (розгортається кнопкою). */
function NavList({
  role,
  onNavigate,
  expanded = true,
}: {
  role: Role
  onNavigate?: () => void
  expanded?: boolean
}) {
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {navFor(role).map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            aria-label={label}
            title={label}
            className={({ isActive }) =>
              cn(
                'group touch-h relative flex items-center gap-3 rounded-md px-3 text-body no-underline',
                !expanded && 'justify-center px-0 2xl:justify-start 2xl:px-3',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                isActive
                  ? 'bg-accent-soft font-semibold text-accent before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-accent'
                  : 'text-text-muted hover:bg-surface-muted hover:text-text',
              )
            }
          >
            <Icon aria-hidden className="size-5 shrink-0" />
            <span className={cn(!expanded && 'hidden 2xl:inline')}>{label}</span>
            {!expanded && (
              <span
                aria-hidden
                className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md border border-border bg-surface-raised px-2 py-1 text-caption font-medium text-text opacity-0 shadow-md group-hover:opacity-100 group-focus-visible:opacity-100 2xl:hidden"
              >
                {label}
              </span>
            )}
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
  const { role } = useDemo()
  const allowed = !isKnownRoute(pathname) || canAccess(role, pathname)
  const section = NAV_ITEMS.find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)))

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="min-h-screen xl:flex">
      <SkipLink />
      <nav
        aria-label="Основна навігація"
        data-print="hide"
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 border-r border-border bg-surface p-2 xl:flex xl:flex-col xl:gap-2',
          wide ? 'w-[14.5rem]' : 'w-14 2xl:w-[14.5rem]',
        )}
      >
        <div className="flex h-10 items-center gap-2 px-0 2xl:px-1">
          <Logo className={cn('mx-auto', wide && 'mx-0', '2xl:mx-0')} />
          <span
            className={cn(
              'min-w-0 text-caption font-semibold leading-4 text-text',
              !wide && 'hidden 2xl:inline',
            )}
          >
            Integrity Assessment Platform
          </span>
        </div>
        <NavList role={role} expanded={wide} />
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

      <div className="min-w-0 flex-1">
        <header data-print="hide" className="sticky top-0 z-30 border-b border-border bg-surface">
          <div className="mx-auto flex max-w-(--content-max) items-center gap-3 px-(--gutter) py-1.5 short:py-1">
            <button
              type="button"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
              className="touch-target inline-flex items-center justify-center gap-2 rounded-md border border-border-strong px-3 text-caption xl:hidden"
            >
              {open ? (
                <X aria-hidden className="size-5" />
              ) : (
                <Menu aria-hidden className="size-5" />
              )}
              <span className="hidden md:inline">Меню</span>
              <span className="sr-only md:hidden">Меню</span>
            </button>
            <Logo className="hidden md:block xl:hidden" />
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-card text-text">{section?.label ?? INSTITUTION}</p>
              <p className="m-0 hidden truncate text-caption text-text-muted md:block">
                {INSTITUTION}. Цикл оцінювання {CYCLE}, станом на {CYCLE_DATE}
              </p>
            </div>
            <HeaderActions role={role} />
          </div>
          {open && (
            <nav
              id="mobile-nav"
              aria-label="Основна навігація"
              className="border-t border-border bg-surface px-(--gutter) py-3 xl:hidden"
            >
              <NavList role={role} onNavigate={() => setOpen(false)} />
            </nav>
          )}
        </header>

        <main
          id="main"
          tabIndex={-1}
          key={pathname}
          className="mx-auto min-w-0 max-w-(--content-max) px-(--gutter) py-3 md:py-4"
        >
          {allowed ? (
            <Outlet />
          ) : (
            <div data-ready="true" className="space-y-4">
              <h1 className="text-title">Сторінка недоступна</h1>
              <ForbiddenState homeHref={defaultRoute(role)} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
