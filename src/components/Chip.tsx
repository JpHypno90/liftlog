import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  icon?: LucideIcon
}

const base =
  'inline-flex items-center gap-1.5 rounded-md border px-3 text-sm font-medium ' +
  'h-8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'disabled:pointer-events-none disabled:opacity-50'

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { active = false, icon: Icon, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      className={cn(
        base,
        active
          ? 'border-accent bg-accent-dim text-accent'
          : 'border-line bg-transparent text-muted hover:text-text hover:border-muted',
        className,
      )}
      {...rest}
    >
      {Icon && <Icon size={14} aria-hidden />}
      {children}
    </button>
  )
})
