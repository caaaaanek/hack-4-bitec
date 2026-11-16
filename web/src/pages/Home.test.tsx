import { render, screen } from '@testing-library/react'
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
  it('показує індекс, рівень, дельту, довіру й обмеження', () => {
    const { container } = setup()
    expect(screen.getByText('Індекс доброчесності')).toBeInTheDocument()
    expect(screen.getByText('Зросло на 7,2 пункта')).toBeInTheDocument()
    expect(screen.getAllByText(/зараховано 60/).length).toBeGreaterThan(0)
    expect(screen.getByText('Показано з обмеженням')).toBeInTheDocument()
    expect(screen.getByText('Варто перевірити додатково')).toBeInTheDocument()
    expect(screen.getAllByText(/Сприйняття/).length).toBeGreaterThan(0)
    expect(container.textContent).not.toMatch(/—|підприємств|рейтинг/i)
  })

  it('перемикає графік на таблицю', async () => {
    setup()
    const buttons = screen.getAllByRole('button', { name: 'Показати як таблицю' })
    expect(buttons).toHaveLength(2)
    await userEvent.click(buttons[1]!)
    expect(screen.getByRole('table', { name: /компонентів/ })).toBeInTheDocument()
  })

  it('банер закривається', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Закрити повідомлення' }))
    expect(screen.queryByText(/інструмент розвитку/)).not.toBeInTheDocument()
  })
})
