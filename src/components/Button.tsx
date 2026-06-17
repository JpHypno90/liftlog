import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'solid' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  /** Apply the animated shine-border treatment (for primary CTAs). */
  shine?: boolean
}

const base =
  'relative inline-flex items-center justify-center gap-2 rounded-md font-body font-medium ' +
  'transition-colors select-none focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  solid: 'bg-accent text-canvas hover:brightness-95 active:brightness-90',
  ghost: 'border border-line bg-transparent text-text hover:bg-card active:bg-panel',
  danger: 'bg-danger text-text hover:brightness-95 active:brightness-90',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'solid', size = 'md', loading = false, shine = false, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], shine && 'shine-border', className)}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
})
