import { useEffect, useState } from 'react'
import { useStore } from '@/store'
import { cn } from '@/lib/cn'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { LogScreen } from '@/features/log/LogScreen'
import { PhasesScreen } from '@/features/phases/PhasesScreen'
import { CompsScreen } from '@/features/comps/CompsScreen'
import { MoreScreen } from '@/features/more/MoreScreen'
import Gallery from '@/Gallery'

function Boot() {
  return (
    <div className="dotgrid flex min-h-full items-center justify-center">
      <span className="aurora font-display text-4xl font-bold uppercase tracking-[0.2em]">
        Iron Log
      </span>
    </div>
  )
}

export default function App() {
  // No router yet — a simple flag swaps in the design-system gallery.
  const showGallery = new URLSearchParams(window.location.search).has('gallery')
  const tab = useStore((s) => s.tab)
  const hydrate = useStore((s) => s.hydrate)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let active = true
    hydrate().finally(() => {
      if (active) setHydrated(true)
    })
    return () => {
      active = false
    }
  }, [hydrate])

  if (showGallery) return <Gallery />
  if (!hydrated) return <Boot />

  // All screens stay mounted; inactive ones are hidden so state is preserved.
  return (
    <div className="dotgrid h-full">
      <div className="mx-auto flex h-full max-w-[480px] flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-8">
          <div className={cn(tab !== 'log' && 'hidden')}>
            <LogScreen />
          </div>
          <div className={cn(tab !== 'phases' && 'hidden')}>
            <PhasesScreen />
          </div>
          <div className={cn(tab !== 'comps' && 'hidden')}>
            <CompsScreen />
          </div>
          <div className={cn(tab !== 'more' && 'hidden')}>
            <MoreScreen />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
