import { Button } from '@uni-feedback/ui'
import { Book } from 'lucide-react'
import { useLastVisitedPath } from '~/hooks/useLastVisitedPath'

export function CTASection() {
  const lastVisitedPath = useLastVisitedPath()
  const browseLink = lastVisitedPath !== '/' ? lastVisitedPath : '/browse'

  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
            Ready to Make Informed Decisions?
          </h2>
          <p className="text-lg text-primary-foreground/90">
            Join thousands of students using Uni Feedback to choose the right
            courses for their academic journey
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 shadow-xl"
              asChild
            >
              <a href={browseLink}>
                <Book className="size-5" />
                Browse Courses
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
