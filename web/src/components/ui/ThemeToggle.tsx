import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { IconButton } from './IconButton'

/** Перемикач теми: у темній темі показує сонце (перейти на світлу), у світлій місяць. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <IconButton
      data-print="hide"
      label={dark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
      aria-pressed={!dark}
      onClick={toggle}
      icon={dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    />
  )
}
