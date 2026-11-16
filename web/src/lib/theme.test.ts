import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { readTheme, useTheme } from './theme'

describe('тема', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    localStorage.clear()
  })

  it('за замовчуванням темна', () => {
    expect(readTheme()).toBe('dark')
  })

  it('перемикає, ставить атрибут і запамʼятовує вибір', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggle())
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('iap-theme')).toBe('light')
    act(() => result.current.toggle())
    expect(result.current.theme).toBe('dark')
  })
})
