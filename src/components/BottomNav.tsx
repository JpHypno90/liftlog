import type { LucideIcon } from 'lucide-react'
import { ClipboardList, Layers, Trophy, Menu } from 'lucide-react'
import type { Tab } from '@/types'
import { useStore } from '@/store'
import { cn } from '@/lib/cn'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'log', label: 'Log', icon: ClipboardList },
  { id: 'phases', label: 'Phases', icon: Layers },
  { id: 'comps', label: 'Comps', icon: Trophy },
  { id: 'more', label: 'More', icon: Menu },
]

export function BottomNav() {
  const tab = useStore((s) => s.tab)
  const setTab = useStore((s) => s.setTab)

  return (
    <nav className="shrink-0 border-t border-line bg-panel px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)_+_0.5rem)]">
      <ul className="flex">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = tab === id
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => setTab(id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex w-full flex-col items-center gap-1 rounded-md py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  isActive ? 'text-accent' : 'text-muted hover:text-text',
                )}
              >
                <Icon size={22} aria-hidden />
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
