import { HeroSearchBar } from './HeroSearchBar'

interface Stats {
  totalFeedback: number
  contributors: number
}

interface HeroSectionProps {
  stats: Stats
}

export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="flex items-center justify-center py-20 md:py-28 px-4">
      <div className="text-center max-w-3xl w-full">
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-4 text-balance">
          Know what you're getting into.
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-6">
          Workload, professors, the tips students share with each other...
          Anonymous feedback from students who took the course.
        </p>

        <HeroSearchBar />

        <p className="text-xs text-muted-foreground/60 mt-2">
          {stats.totalFeedback.toLocaleString()}+ reviews · {stats.contributors}
          + contributors · 100% free
        </p>
      </div>
    </section>
  )
}
