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
            Share what you wish you'd known.
          </h2>
          <p className="text-muted-foreground text-base">
            Your feedback, once, helps hundreds of students for years.
          </p>
          <Button size="lg" className="text-base px-8" asChild>
            <a href="/feedback/new">Help the next student →</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
