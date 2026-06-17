import { Dumbbell } from 'lucide-react'

export default function App() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 bg-canvas px-6 text-center">
      <Dumbbell className="h-16 w-16 text-accent" strokeWidth={1.5} aria-hidden />
      <h1 className="aurora-text font-display text-6xl font-bold uppercase tracking-[0.15em] sm:text-7xl">
        Iron Log
      </h1>
      <p className="font-body text-sm uppercase tracking-[0.3em] text-muted">
        Phase 0 scaffold is live
      </p>
    </main>
  )
}
