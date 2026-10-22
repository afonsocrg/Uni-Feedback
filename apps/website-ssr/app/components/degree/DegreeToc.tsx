import {
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@uni-feedback/ui'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DegreeSectionId } from '~/utils/analytics'
import { scrollToSection, type TocSection } from './scrollSpy'

/** Desktop: the sticky list on the right. */
export function DegreeTocSidebar({
  sections,
  current,
  onNavigate
}: {
  sections: TocSection[]
  current: DegreeSectionId | null
  onNavigate: (id: DegreeSectionId) => void
}) {
  const { t } = useTranslation('browse')
  return (
    <nav
      aria-label={t('degree_page.toc_label')}
      className="sticky top-24 text-sm"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t('degree_page.toc_label')}
      </p>
      <ul>
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={current === section.id ? 'location' : undefined}
              onClick={(event) => {
                event.preventDefault()
                onNavigate(section.id)
                scrollToSection(section.id)
              }}
              className={cn(
                'block border-l-2 py-1.5 pl-3 transition-colors',
                current === section.id
                  ? 'border-primaryBlue font-semibold text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * Phones: a sticky "Nesta página" bar under the site header, naming the current
 * section, that opens the section list as a bottom sheet.
 */
export function DegreeTocBar({
  sections,
  current,
  onNavigate,
  onOpen
}: {
  sections: TocSection[]
  current: DegreeSectionId | null
  onNavigate: (id: DegreeSectionId) => void
  onOpen: () => void
}) {
  const { t } = useTranslation('browse')
  const [open, setOpen] = useState(false)
  // Sticks right under the site header, whose height differs by breakpoint
  const [top, setTop] = useState<number | null>(null)
  useEffect(() => {
    const header = document.querySelector('header')
    if (!header) return
    const measure = () => setTop(header.getBoundingClientRect().height)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])
  const currentLabel =
    sections.find((s) => s.id === current)?.label ?? sections[0]?.label

  return (
    <>
      <div
        style={top !== null ? { top } : undefined}
        className="sticky top-[69px] z-40 border-b border-border bg-background md:top-[71px] lg:hidden"
      >
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">
            {t('degree_page.toc_label')}
          </span>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => {
              setOpen(true)
              onOpen()
            }}
            className="flex min-w-0 items-center gap-1 font-semibold text-foreground"
          >
            <span className="truncate">{currentLabel}</span>
            <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
          </button>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-xl pb-6">
          <SheetHeader className="pb-0">
            <SheetTitle>{t('degree_page.toc_label')}</SheetTitle>
            <SheetDescription className="sr-only">
              {t('degree_page.toc_label')}
            </SheetDescription>
          </SheetHeader>
          <ul className="px-4">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={current === section.id ? 'location' : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    onNavigate(section.id)
                    setOpen(false)
                    // After the sheet releases the scroll lock
                    setTimeout(() => scrollToSection(section.id), 320)
                  }}
                  className={cn(
                    'block border-b border-border py-3',
                    current === section.id
                      ? 'font-semibold text-primaryBlue'
                      : 'text-foreground'
                  )}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  )
}
