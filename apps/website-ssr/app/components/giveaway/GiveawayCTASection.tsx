import { Button } from '@uni-feedback/ui'
import { PenSquare } from 'lucide-react'
import { analytics, getPageName } from '~/utils/analytics'

export function GiveawayCTASection() {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
            Ready to Enter?
          </h2>
          <p className="text-lg text-primary-foreground/90">
            Submit your first review now and start earning points for the draw!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 shadow-xl"
              asChild
            >
              <a
                href="/feedback/new"
                onClick={() => {
                  analytics.navigation.feedbackFormLinkClicked({
                    source: 'giveaway_cta',
                    referrerPage: getPageName(window.location.pathname)
                  })
                }}
              >
                <PenSquare className="size-5" />
                Give Feedback
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
