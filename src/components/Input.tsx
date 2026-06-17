import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const fieldBase =
  'w-full rounded-md border bg-card px-3 text-base text-text placeholder:text-faint ' +
  'transition-colors focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50'

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  // `className` styles the field wrapper (layout/width), keeping the control's
  // height and styling consistent across every usage.
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(fieldBase, 'h-10', error ? 'border-danger' : 'border-line')}
        {...rest}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
})
