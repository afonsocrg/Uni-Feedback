import { Button } from '@uni-feedback/ui'
import { GraduationCap } from 'lucide-react'
import { NavLink } from './NavLink'

interface NavItem {
  href: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#faq', label: 'FAQ' }
]

export function LandingHeader() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <GraduationCap className="size-8 text-primary" />
          <span className="text-xl font-semibold text-foreground">
            Uni Feedback
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Button size="sm" variant="ghost" asChild>
            <a href="/feedback/new">Give Feedback!</a>
          </Button>
          <Button
            size="sm"
            className="shadow-lg shadow-primary/20 bg-gradient-to-br from-primary to-primary/90"
            asChild
          >
            <a href="/browse">Browse Courses</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
