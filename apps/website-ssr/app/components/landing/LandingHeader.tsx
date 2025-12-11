import { Button } from '@uni-feedback/ui'
import { GraduationCap } from 'lucide-react'

export function LandingHeader() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-8 text-primary" />
          <span className="text-xl font-semibold text-foreground">
            Uni Feedback
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </a>
          <a
            href="#testimonials"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Testimonials
          </a>
          <a
            href="#faq"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            FAQ
          </a>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Button size="sm" variant="ghost">
            Browse Feedback
          </Button>
          <Button
            size="sm"
            className="shadow-lg shadow-primary/20 bg-gradient-to-br from-primary to-primary/90"
          >
            Give Feedback!
          </Button>
        </div>
      </div>
    </header>
  )
}
