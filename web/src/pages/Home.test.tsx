import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ToastProvider } from '@/components/ui'
import { Home } from './Home'

const setup = () =>
  render(
    <ToastProvider>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </ToastProvider>,
  )

describe('Dashboard', () => {
  it('має не більше п’яти карток і по одному заголовку на картку', () => {
    const { container } = setup()
    const cards = container.querySelectorAll('[data-print="card"]')
    expect(cards.length).toBeLessThanOrEqual(5)
    for (const c of cards) expect(c.querySelectorAll('h2')).toHaveLength(1)
  })

  it('показує індекс, рівень, дельту, достовірність і обмеження', () => {
    const { container } = setup()
    expect(screen.getByRole('heading', { name: 'Огляд закладу' })).toBeInTheDocument()
    expect(screen.getByText('Індекс доброчесності')).toBeInTheDocument()
    expect(screen.getByText('Зросло на 7,2 пункта')).toBeInTheDocument()
    expect(screen.getByTestId('summary')).toHaveTextContent(
      '54,2 бала, Визначений, достовірність C',
    )
    expect(screen.getByText('Підзвітність: самооцінку не підтверджують факти')).toBeInTheDocument()
    expect(screen.getByText('Потрібна перевірка')).toBeInTheDocument()
    expect(screen.getByText('Зараховано з обмеженням')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/—|підприємств|рейтинг/i)
  })

  it('плитки компонентів ведуть на розклад компонента', () => {
    setup()
    const section = screen.getByRole('region', { name: 'Компоненти індексу' })
    const link = within(section).getByRole('link', { name: /Підзвітність/ })
    expect(link).toHaveAttribute('href', '/explain?c=accountability')
  })

  it('пояснення обмеження показується в підказці', async () => {
    setup()
    await userEvent.hover(screen.getByText('Зараховано з обмеженням'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Сприйняття 80, факти 35, зараховано 60')
  })

  it('прапорці згорнуті й розкриваються з aria-expanded', async () => {
    setup()
    const btn = screen.getByRole('button', { name: /Прапорці \(2\)/ })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/Розбіжність сприйняття й фактів у Підзвітності/)).not.toBeVisible()
    await userEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText(/Розбіжність сприйняття й фактів у Підзвітності \(80 проти 35\)/),
    ).toBeVisible()
  })

  it('«Читати повністю» розкриває висновок', async () => {
    setup()
    const btn = screen.getByRole('button', { name: 'Читати повністю' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(btn)
    expect(screen.getByRole('button', { name: 'Згорнути' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('радар за замовчуванням, динаміка у другій вкладці, обидва мають таблицю', async () => {
    setup()
    expect(screen.getByRole('tab', { name: 'Радар' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Показати як таблицю' }))
    expect(screen.getByRole('table', { name: /компонентів/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Динаміка' }))
    await userEvent.click(screen.getByRole('button', { name: 'Показати як таблицю' }))
    expect(screen.getByRole('table', { name: /за цикли оцінювання/ })).toBeInTheDocument()
  })
})
