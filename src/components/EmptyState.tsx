import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  text?: string
  /** Optional call-to-action, e.g. a <Button>. */
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, text, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-12 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-line bg-card text-muted">
        <Icon size={24} aria-hidden />
      </div>
      <h3 className="font-display text-lg text-text">{title}</h3>
      {text && <p className="max-w-xs text-sm text-muted">{text}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
