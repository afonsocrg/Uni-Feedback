import { Separator } from '@uni-feedback/ui'
import { GraduationCap, Instagram } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { useLastVisitedPath } from '~/hooks/useLastVisitedPath'
import { analytics, getPageName } from '~/utils/analytics'
import { getLocalePath, getReviewPath } from '~/utils/i18n-routes'
import { FooterLink } from './FooterLink'

interface FooterLinkItem {
  href: string
  label: string
  onClick?: () => void
}

interface FooterLinkGroup {
  title: string
  links: FooterLinkItem[]
}

export function LandingFooter() {
  const { t } = useTranslation()
  const lang = useLang()
  const lastVisitedPath = useLastVisitedPath()
  const browsePath = getLocalePath('browse', lang)
  const browseLink = lastVisitedPath !== '/' ? lastVisitedPath : browsePath

  const FOOTER_LINK_GROUPS: FooterLinkGroup[] = [
    {
      title: t('footer.groups.explore'),
      links: [
        { href: browseLink, label: t('footer.links.browse_courses') },
        {
          href: `${getReviewPath(lang)}?from=footer`,
          label: t('footer.links.give_feedback'),
          onClick: () => {
            analytics.navigation.feedbackFormLinkClicked({
              source: 'footer',
              referrerPage: getPageName(window.location.pathname)
            })
          }
        }
      ]
    },
    {
      title: t('footer.groups.rewards'),
      links: [
        {
          href: getLocalePath('points', lang),
          label: t('footer.links.earn_points')
        },
        {
          href: getLocalePath('giveaway', lang),
          label: t('footer.links.giveaway')
        }
      ]
    },
    {
      title: t('footer.groups.about'),
      links: [
        {
          href: `${getLocalePath('home', lang)}#testimonials`,
          label: t('footer.links.testimonials')
        },
        {
          href: getLocalePath('supporters', lang),
          label: t('footer.links.supporters')
        }
        // {
        //   href: 'https://github.com/afonsocrg/uni-feedback',
        //   label: 'Open Source'
        // }
      ]
    },
    {
      title: t('footer.groups.help'),
      links: [
        {
          href: `${getLocalePath('home', lang)}#faq`,
          label: t('footer.links.faq')
        },
        {
          href: getLocalePath('guidelines', lang),
          label: t('footer.links.guidelines')
        },
        {
          href: getLocalePath('contact', lang),
          label: t('footer.links.contact')
        }
      ]
    },
    {
      title: t('footer.groups.legal'),
      links: [
        { href: getLocalePath('terms', lang), label: t('footer.links.terms') },
        {
          href: getLocalePath('privacy', lang),
          label: t('footer.links.privacy')
        }
      ]
    }
  ]

  return (
    <footer className="bg-background border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="md:w-56 md:shrink-0 space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-6 text-primary" />
              <span className="text-lg font-semibold">Uni Feedback</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('footer.tagline')}
            </p>
            <a
              href="https://www.instagram.com/unifeedback"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
            >
              <Instagram className="size-5" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-6 flex-1">
            {FOOTER_LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="font-semibold mb-4">{group.title}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {group.links.map((link) => (
                    <li key={link.href + link.label}>
                      <FooterLink href={link.href} onClick={link.onClick}>
                        {link.label}
                      </FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>{t('footer.built_by')}</p>
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  )
}
