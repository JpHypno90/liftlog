import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from '@/components/IconButton'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/** Bottom-sheet overlay: backdrop blur, slide-up, focus trap, closes on backdrop click + Esc. */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    restoreFocusRef.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const target = panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel
    target?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      restoreFocusRef.current?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in"
      onKeyDown={onKeyDown}
    >
      <div
        className="absolute inset-0 bg-scrim backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative w-full max-w-lg animate-slide-up rounded-t-lg border-t border-line bg-panel p-4 pb-6 shadow-card focus:outline-none"
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          {title && <h2 className="font-display text-xl text-text">{title}</h2>}
          <IconButton icon={X} aria-label="Close" size="sm" onClick={onClose} className="ml-auto" />
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
