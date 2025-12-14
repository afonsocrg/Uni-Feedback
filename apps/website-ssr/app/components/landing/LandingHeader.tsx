import { Button } from '@uni-feedback/ui'
import { GraduationCap } from 'lucide-react'
import { useLastVisitedPath } from '~/hooks/useLastVisitedPath'

interface NavItem {
  href: string
  label: string
}

export function LandingHeader() {
  const lastVisitedPath = useLastVisitedPath()
  const browseLink = lastVisitedPath !== '/' ? lastVisitedPath : '/browse'

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <GraduationCap className="size-8 text-primary" />
          <span className="text-xl font-semibold text-foreground">
            Uni Feedback
          </span>
        </a>
        <div className="hidden md:flex items-center gap-3">
          <Button size="sm" variant="ghost" asChild>
            <a href="/feedback/new">Give Feedback!</a>
          </Button>
          <Button
            size="sm"
            className="shadow-lg shadow-primary/20 bg-gradient-to-br from-primary to-primary/90"
            asChild
          >
            <a href={browseLink}>Browse Courses</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
