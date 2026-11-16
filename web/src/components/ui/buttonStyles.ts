export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium select-none touch-h ' +
  'transition-colors duration-150 ease-standard ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ' +
  'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50'

export const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-active',
  secondary:
    'bg-surface text-text border border-border-strong hover:bg-surface-muted active:bg-border',
  ghost: 'bg-transparent text-accent hover:bg-accent-soft active:bg-accent-soft',
  danger: 'bg-critical-solid text-on-accent hover:brightness-90 active:brightness-75',
}

export const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3 text-caption',
  md: 'px-4 text-body',
  lg: 'px-6 text-body-lg',
}
