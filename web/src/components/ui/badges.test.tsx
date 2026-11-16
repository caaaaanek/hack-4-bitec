import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'
import { MaturityBadge } from './MaturityBadge'
import { TrustBadge } from './TrustBadge'
import { SourceLabel } from './SourceMarker'
import { MATURITY, SOURCES, STATUSES, type StatusId } from './config'

describe('badges', () => {
  it('every status renders label and icon', () => {
    for (const id of Object.keys(STATUSES) as StatusId[]) {
      const { container, unmount } = render(<StatusBadge status={id} />)
      expect(screen.getByText(STATUSES[id].label)).toBeInTheDocument()
      expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
      unmount()
    }
  })
  it('has nine statuses', () => expect(Object.keys(STATUSES)).toHaveLength(9))
  it('maturity names match the brief exactly', () => {
    expect(Object.values(MATURITY).map((m) => m.name)).toEqual([
      'Початковий (хаотичний)',
      'Керований',
      'Визначений',
      'Вимірюваний',
      'Оптимізуючий',
    ])
  })
  it('has four data sources', () => {
    expect(Object.values(SOURCES).map((s) => s.label)).toEqual([
      'Сприйняття РГ',
      'Сприйняття ОС',
      'Експерти',
      'Факти',
    ])
  })
  it('maturity shows digit, name and data attribute', () => {
    const { container } = render(<MaturityBadge level={3} />)
    expect(container).toHaveTextContent('3')
    expect(container).toHaveTextContent('Визначений')
    expect(container.querySelector('[data-maturity="3"]')).not.toBeNull()
  })
  it('trust has accessible text', () => {
    render(<TrustBadge level="medium" />)
    expect(screen.getByText('Середня')).toBeInTheDocument()
    expect(screen.getByText(/Довіра до оцінки/)).toBeInTheDocument()
  })
  it('source label has marker shape', () => {
    const { container } = render(<SourceLabel source="experts" />)
    expect(container.querySelector('path')).not.toBeNull()
  })
})
