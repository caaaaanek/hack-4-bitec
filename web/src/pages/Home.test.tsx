import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { ToastProvider } from '@/components/ui'
import { resetDecisions } from '@/demo/decisionsStore'
import { Home } from './Home'

const setup = () =>
  render(
    <ToastProvider>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </ToastProvider>,
  )

afterEach(() => resetDecisions())

describe('Дашборд', () => {
  it('має по одному заголовку h2 на картку і без банера', () => {
    const { container } = setup()
    const cards = container.querySelectorAll('section[data-print="card"]')
    expect(cards.length).toBe(5)
    for (const c of cards) expect(c.querySelectorAll('h2')).toHaveLength(1)
    expect(screen.queryByText(/інструмент розвитку/)).not.toBeInTheDocument()
  })

  it('заголовок і три кнопки швидких переходів', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Огляд закладу' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Чому такий індекс' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Рекомендації' })).toHaveAttribute(
      'href',
      '/recommendations',
    )
    expect(screen.getByRole('link', { name: 'Звіт' })).toHaveAttribute('href', '/reports')
  })

  it('чотири KPI-плитки пояснені текстом', () => {
    setup()
    const tiles = within(screen.getByRole('list', { name: 'Ключові показники' }))
    expect(tiles.getAllByRole('listitem')).toHaveLength(4)
    expect(tiles.getByText('Рівень 3: Визначений')).toBeInTheDocument()
    expect(tiles.getByText('Прапорці: 2')).toBeInTheDocument()
    expect(tiles.getByText('З них 1 прострочено')).toBeInTheDocument()
    expect(tiles.getByRole('link', { name: /Заходи в трекері: 6/ })).toHaveAttribute(
      'href',
      '/tracker',
    )
  })

  it('показує індекс, рівень, дельту, достовірність і причину', () => {
    const { container } = setup()
    expect(screen.getByTestId('summary')).toHaveTextContent(
      '54,2 бала, Визначений, достовірність C',
    )
    expect(screen.getAllByText('Зросло на 7,2 пункта').length).toBeGreaterThan(0)
    expect(screen.getByText('Підзвітність: самооцінку не підтверджують факти')).toBeInTheDocument()
    expect(screen.getAllByText('Потрібна перевірка').length).toBeGreaterThan(0)
    expect(screen.getByText('Дані станом на 16.11.2026 · цикл 2026-11')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/—|підприємств|рейтинг/i)
  })

  it('компоненти ведуть на розклад компонента, обмеження пояснено підказкою', async () => {
    setup()
    const section = screen.getByRole('region', { name: 'Компоненти індексу' })
    expect(within(section).getByRole('link', { name: /Підзвітність/ })).toHaveAttribute(
      'href',
      '/explain?c=accountability',
    )
    await userEvent.hover(screen.getByText('Зараховано з обмеженням'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Сприйняття 80, факти 35, зараховано 60')
  })

  it('«Що потребує уваги»: нейтральні рядки з великої літери, сильні сторони окремо', () => {
    setup()
    const section = screen.getByRole('region', { name: 'Що потребує уваги' })
    expect(within(section).getByText('Підтвердити факти')).toBeInTheDocument()
    expect(within(section).getByText('Сильні сторони')).toBeInTheDocument()
  })

  it('«Чому такий індекс» відкриває панель із фокусом, закривається Esc', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Чому такий індекс' }))
    const dialog = screen.getByRole('dialog', { name: 'Чому такий індекс' })
    expect(within(dialog).getByText('Показано з обмеженням')).toBeInTheDocument()
    expect(within(dialog).getByText('Як це рахується')).toBeInTheDocument()
    expect(within(dialog).getByText('Шкала рівнів зрілості')).toBeInTheDocument()
    expect(within(dialog).getByText(/Це інструмент розвитку, а не контролю/)).toBeInTheDocument()
    expect(dialog.contains(document.activeElement)).toBe(true)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('плитка достовірності відкриває панель на прапорцях', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /Достовірність C, прапорці: 2/ }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Варто перевірити додатково')).toBeInTheDocument()
    expect(
      within(dialog).getByText(/Розбіжність сприйняття й фактів у Підзвітності \(80 проти 35\)/),
    ).toBeInTheDocument()
  })

  it('динаміка: період, лінії компонентів і таблиця', async () => {
    setup()
    const card = screen.getByRole('region', { name: 'Динаміка індексу' })
    expect(within(card).getByRole('link', { name: 'Детальніше' })).toHaveAttribute(
      'href',
      '/trends',
    )
    const culture = within(card).getByRole('button', { name: /Культура/ })
    expect(culture).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(culture)
    expect(culture).toHaveAttribute('aria-pressed', 'true')
    await userEvent.selectOptions(within(card).getByLabelText('Початок періоду'), '2025-12')
    await userEvent.click(within(card).getByRole('button', { name: 'Показати як таблицю' }))
    const table = within(card).getByRole('table', { name: /Індекс і компоненти/ })
    expect(within(table).getByText('2025-12')).toBeInTheDocument()
    expect(within(table).queryByText('2025-06')).not.toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Культура' })).toBeInTheDocument()
  })

  it('радар має таблицю-дубль', async () => {
    setup()
    const card = screen.getByRole('region', { name: 'Радар компонентів' })
    await userEvent.click(within(card).getByRole('button', { name: 'Показати як таблицю' }))
    expect(within(card).getByRole('table', { name: /компонентів/ })).toBeInTheDocument()
  })
})
