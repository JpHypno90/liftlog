import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { ButtonVariant, ButtonSize } from '@/components/Button'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  /** Required for accessibility — there is no visible text. */
  'aria-label': string
  variant?: ButtonVariant
  size?: ButtonSize
}

const base =
  'inline-flex items-center justify-center rounded-md transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'disabled:pointer-events-none disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  solid: 'bg-accent text-canvas hover:brightness-95 active:brightness-90',
  ghost: 'border border-line bg-transparent text-muted hover:bg-card hover:text-text',
  danger: 'bg-danger text-text hover:brightness-95 active:brightness-90',
}

const sizes: Record<ButtonSize, { box: string; icon: number }> = {
  sm: { box: 'h-8 w-8', icon: 16 },
  md: { box: 'h-10 w-10', icon: 18 },
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, variant = 'ghost', size = 'md', className, ...rest },
  ref,
) {
  const s = sizes[size]
  return (
    <button ref={ref} className={cn(base, variants[variant], s.box, className)} {...rest}>
      <Icon size={s.icon} aria-hidden />
    </button>
  )
})
