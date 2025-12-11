import { Separator } from '@uni-feedback/ui'
import { GraduationCap } from 'lucide-react'
import { FooterLink } from './FooterLink'

interface FooterLinkItem {
  href: string
  label: string
}

interface FooterLinkGroup {
  title: string
  links: FooterLinkItem[]
}

const FOOTER_LINK_GROUPS: FooterLinkGroup[] = [
  {
    title: 'Platform',
    links: [
      { href: '#', label: 'Browse Courses' },
      { href: '#', label: 'Give Feedback' },
      { href: '#', label: 'Open Source' },
      { href: '#', label: 'Partners' }
    ]
  },
  {
    title: 'Resources',
    links: [
      { href: '#', label: 'How It Works' },
      { href: '#', label: 'FAQ' },
      { href: '#', label: 'Get in Touch' },
      { href: '#', label: 'Sponsors' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { href: '#', label: 'Terms and Conditions' },
      { href: '#', label: 'Privacy Policy' }
    ]
  }
]

export function LandingFooter() {
  return (
    <footer className="bg-muted/30 border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-6 text-primary" />
              <span className="text-lg font-semibold">Uni Feedback</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Helping students make better academic decisions through honest,
              anonymous course feedback.
            </p>
          </div>
          {FOOTER_LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="font-semibold mb-4">{group.title}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Built with ❤️ by @afonsocrg</p>
          <p>© 2025 Uni Feedback. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
