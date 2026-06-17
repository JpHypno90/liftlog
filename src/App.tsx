import { Dumbbell } from 'lucide-react'
import Gallery from '@/Gallery'

export default function App() {
  // No router yet (Phase 0/1) — a simple flag swaps in the component gallery.
  const showGallery = new URLSearchParams(window.location.search).has('gallery')
  if (showGallery) return <Gallery />

  return (
    <main className="dotgrid flex min-h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <Dumbbell className="h-16 w-16 text-accent" strokeWidth={1.5} aria-hidden />
      <h1 className="aurora font-display text-6xl font-bold uppercase tracking-[0.15em] sm:text-7xl">
        Iron Log
      </h1>
      <p className="font-body text-sm uppercase tracking-[0.3em] text-muted">
        Phase 0 scaffold is live
      </p>
      <a
        href="?gallery"
        className="text-sm font-medium text-faint underline-offset-4 transition-colors hover:text-accent hover:underline"
      >
        View design system →
      </a>
    </main>
  )
}
