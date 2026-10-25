import type { EntityLinkKind } from '@uni-feedback/db/schema'
import { cn } from '@uni-feedback/ui'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FaFacebook,
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
 * A school's official profiles as a row of icons, in the header of the
 * university and faculty pages. Only reviewed links reach here.
 */
export function OfficialLinks({
  name,
  links,
  onClick,
  className
}: {
  /** The school's short name, for the accessible labels */
  name: string
  links: { kind: EntityLinkKind; url: string }[]
  onClick: (kind: EntityLinkKind) => void
  className?: string
}) {
  const { t } = useTranslation()
  if (links.length === 0) return null
  return (
    <ul
      className={cn('mt-4 flex flex-wrap items-center gap-1', className)}
      aria-label={t('official_links.label', { name })}
    >
      {links.map((link) => {
        const Icon = ICONS[link.kind]
        return (
          <li key={link.kind}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onClick(link.kind)}
              aria-label={t(`official_links.${link.kind}`, { name })}
              title={t(`official_links.${link.kind}`, { name })}
              className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="size-4" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
