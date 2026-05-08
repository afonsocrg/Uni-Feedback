import { Button } from '@uni-feedback/ui'

interface CTASectionProps {
  contributors: number
}

export function CTASection({ contributors }: CTASectionProps) {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-[560px] mx-auto text-center space-y-6">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
            Join {contributors}+ students who already contributed.
          </h2>
          <Button size="lg" className="text-base px-8 mt-2" asChild>
            <a href="/feedback/new">Add my experience →</a>
          </Button>
          <p className="text-xs text-muted-foreground/60">
            100% anonymous · Takes 2 minutes
          </p>
        </div>
      </div>
    </section>
  )
}
