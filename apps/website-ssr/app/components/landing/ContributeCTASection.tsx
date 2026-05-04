import { Button } from '@uni-feedback/ui'

interface ContributeCTASectionProps {
  contributors: number
}

export function ContributeCTASection({
  contributors
}: ContributeCTASectionProps) {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
            Be the answer someone needed last semester.
          </h2>
          <p className="text-muted-foreground text-lg">
            Most of us already share our opinion about courses. Do it here once,
            and instead of helping one friend, you help every student who comes
            after you.
          </p>
          <div className="space-y-1">
            <div className="text-4xl font-bold text-primary">
              {contributors}+
            </div>
            <p className="text-muted-foreground text-sm">
              students already shared their experience
            </p>
            <p className="text-muted-foreground/60 text-sm">
              100% anonymous · Takes 2 minutes
            </p>
          </div>
          <Button size="lg" className="text-base px-8" asChild>
            <a href="/feedback/new">Be that answer →</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
