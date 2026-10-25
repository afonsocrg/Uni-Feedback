import type { EntityLinkKind } from '@uni-feedback/db/schema'
import { cn } from '@uni-feedback/ui'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FaFacebook,
  FaGlobe,
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaXTwitter,
  FaYoutube
} from 'react-icons/fa6'

/** Each network's own mark, one set so they share a weight and size */
const ICONS: Record<EntityLinkKind, ComponentType<{ className?: string }>> = {
  linkedin: FaLinkedin,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  x: FaXTwitter,
  facebook: FaFacebook,
  youtube: FaYoutube
}

/**
 * A school's website and official profiles as a row of icons, in the header
 * of the university and faculty pages. Only reviewed links reach here.
 */
export function OfficialLinks({
  name,
  website,
  links,
  onClick,
  className
}: {
  /** The school's short name, for the accessible labels */
  name: string
  /** Its own website, shown first as a globe */
  website?: string | null
  links: { kind: EntityLinkKind; url: string }[]
  onClick: (target: EntityLinkKind | 'official_site') => void
  className?: string
}) {
  const { t } = useTranslation()
  const items = [
    ...(website
      ? [
          {
            key: 'official_site' as const,
            url: website,
            Icon: FaGlobe,
            label: t('official_links.website', { name })
          }
        ]
      : []),
    ...links.map((link) => ({
      key: link.kind,
      url: link.url,
      Icon: ICONS[link.kind],
      label: t(`official_links.${link.kind}`, { name })
    }))
  ]
  if (items.length === 0) return null
  return (
    <ul
      className={cn('mt-4 flex flex-wrap items-center gap-3', className)}
      aria-label={t('official_links.label', { name })}
    >
      {items.map(({ key, url, Icon, label }) => (
        <li key={key}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onClick(key)}
            aria-label={label}
            title={label}
            className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground/80"
          >
            <Icon className="size-4" />
          </a>
        </li>
      ))}
    </ul>
  )
}
