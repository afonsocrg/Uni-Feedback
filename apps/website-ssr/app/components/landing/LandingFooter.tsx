import { Separator } from '@uni-feedback/ui'
import { GraduationCap } from 'lucide-react'
import { useLastVisitedPath } from '~/hooks/useLastVisitedPath'
import { FooterLink } from './FooterLink'

interface FooterLinkItem {
  href: string
  label: string
}

interface FooterLinkGroup {
  title: string
  links: FooterLinkItem[]
}

export function LandingFooter() {
  const lastVisitedPath = useLastVisitedPath()
  const browseLink = lastVisitedPath !== '/' ? lastVisitedPath : '/browse'

  const FOOTER_LINK_GROUPS: FooterLinkGroup[] = [
    {
      title: 'Platform',
      links: [
        { href: browseLink, label: 'Browse Courses' },
        { href: '/feedback/new', label: 'Give Feedback' },
        { href: '/partners', label: 'Partners' },
        {
          href: 'https://github.com/afonsocrg/uni-feedback',
          label: 'Open Source'
        }
        // { href: '#', label: 'Partners' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { href: '/#how-it-works', label: 'How It Works' },
        { href: '/#testimonials', label: 'Testimonials' },
        { href: '/#faq', label: 'FAQ' },
        { href: '/#contact', label: 'Get in Touch' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { href: '/terms', label: 'Terms and Conditions' },
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/guidelines', label: 'Guidelines' }
      ]
    }
  ]

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
              From students, for students. Your companion for building a better
              and successful university experience.
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
          <p>
            © {new Date().getFullYear()} Uni Feedback. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
