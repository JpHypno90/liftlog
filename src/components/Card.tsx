import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type CardProps = HTMLAttributes<HTMLDivElement>

/** Base surface container — card background, hairline border, soft elevation. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('rounded-lg border border-line bg-card p-4 shadow-card', className)}
      {...rest}
    >
      {children}
    </div>
  )
})
