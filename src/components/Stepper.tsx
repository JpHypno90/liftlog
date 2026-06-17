import { useId } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton } from '@/components/IconButton'

export interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  className?: string
  disabled?: boolean
}

/** Numeric +/- control. Controlled; clamps to [min, max]. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  label,
  className,
  disabled = false,
}: StepperProps) {
  const labelId = useId()
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  const set = (n: number) => {
    const next = clamp(n)
    if (next !== value) onChange(next)
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <span id={labelId} className="text-sm font-medium text-muted">
          {label}
        </span>
      )}
      <div
        role="group"
        aria-labelledby={label ? labelId : undefined}
        className="inline-flex items-center gap-2"
      >
        <IconButton
          icon={Minus}
          size="sm"
          aria-label="Decrease"
          disabled={disabled || value <= min}
          onClick={() => set(value - step)}
        />
        <span className="min-w-10 text-center font-display text-lg tabular-nums text-text">
          {value}
        </span>
        <IconButton
          icon={Plus}
          size="sm"
          aria-label="Increase"
          disabled={disabled || value >= max}
          onClick={() => set(value + step)}
        />
      </div>
    </div>
  )
}
