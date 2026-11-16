import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Info, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ForbiddenState, Logo, SkipLink, Tooltip } from '@/components/ui'
import { useInstitution } from '@/demo/useInstitution'
import { useNavCounts } from '@/demo/navCounts'
import { canAccess, defaultRoute, isKnownRoute, type Role } from '@/lib/access'
import { useDemo } from '@/demo/demoContext'
import { HeaderActions } from './HeaderActions'
import { navFor } from './nav'

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
  const counts = useNavCounts()
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {navFor(role).map(({ to, label, icon: Icon, end }) => {
        const count = counts[to]
        return (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              aria-label={count ? `${label}. ${count.label}` : label}
              title={count ? `${label}. ${count.label}` : label}
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
              {count && (
                <span
                  aria-hidden
                  className={cn(
                    'rounded-full bg-neutral-bg px-1.5 text-caption font-semibold tabular text-neutral-text',
                    expanded
                      ? 'ml-auto'
                      : 'absolute right-0.5 top-0.5 px-1 text-[10px] leading-4 2xl:static 2xl:ml-auto 2xl:px-1.5 2xl:text-caption',
                  )}
                >
                  {expanded ? (
                    count.text
                  ) : (
                    <>
                      <span className="2xl:hidden">{count.short}</span>
                      <span className="hidden 2xl:inline">{count.text}</span>
                    </>
                  )}
                </span>
              )}
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
        )
      })}
    </ul>
  )
}

export function AppShell() {
  const [open, setOpen] = useState(false)
  const [wide, setWide] = useState(false)
  const { pathname } = useLocation()
  const { role } = useDemo()
  const institution = useInstitution()
  const allowed = !isKnownRoute(pathname) || canAccess(role, pathname)

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
          'sticky top-0 hidden h-dvh shrink-0 overflow-y-auto overflow-x-hidden border-r border-border bg-surface p-2 xl:flex xl:flex-col xl:gap-2',
          wide ? 'w-[232px]' : 'w-14 2xl:w-[232px]',
        )}
      >
        <div className="flex h-10 items-center gap-2 px-0 2xl:px-1">
          <Logo className={cn('mx-auto', wide && 'mx-0', '2xl:mx-0')} />
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
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <p className="m-0 hidden shrink-0 items-center gap-1 text-caption font-semibold text-text-muted lg:flex">
                Integrity Assessment Platform
                <Tooltip
                  placement="bottom"
                  content="Оцінювання це інструмент розвитку, а не контролю. Результати показують, куди рухатися далі."
                >
                  <span role="img" aria-label="Про продукт" className="inline-flex text-text-muted">
                    <Info aria-hidden className="size-4" />
                  </span>
                </Tooltip>
              </p>
              <p className="m-0 min-w-0 truncate text-card text-text">
                {role === 'observer' && pathname === '/institutions'
                  ? 'Усі заклади'
                  : institution.name}
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
          {allowed && role === 'observer' && pathname !== '/institutions' && (
            <nav aria-label="Хлібні крихти" className="mb-2 text-caption text-text-muted">
              <Link to="/institutions" className="text-accent underline underline-offset-2">
                Усі заклади
              </Link>
              <span aria-hidden> / </span>
              <span aria-current="page">{institution.name}</span>
            </nav>
          )}
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
