import { forwardRef, useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { fieldBase } from '@/components/Input'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className, rows = 4, ...rest },
  ref,
) {
  const autoId = useId()
  const taId = id ?? autoId
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={taId} className="text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={taId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(fieldBase, 'resize-y py-2', error ? 'border-danger' : 'border-line', className)}
        {...rest}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
})
