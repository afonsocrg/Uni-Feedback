import { Button } from '@uni-feedback/ui'
import { PenLine } from 'lucide-react'

interface ContributeCTASectionProps {
  contributors: number
}

export function ContributeCTASection({
  contributors
}: ContributeCTASectionProps) {
  return (
    <section className="py-16 md:py-24 bg-muted/40">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight">
            Help the students coming after you
          </h2>
          <p className="text-muted-foreground text-lg">
            <span className="font-medium text-foreground">{contributors}+</span>{' '}
            students already shared their experience.
            <br />
            It takes 2 minutes. Your name stays private.
          </p>
          <Button size="lg" asChild>
            <a href="/feedback/new">
              <PenLine className="size-4" />
              Share your experience
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
