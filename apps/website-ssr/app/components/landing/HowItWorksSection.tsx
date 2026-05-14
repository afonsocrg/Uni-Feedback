import { FileText, PenSquare, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function HowItWorksSection() {
  const { t } = useTranslation('landing')

  return (
    <section id="how-it-works" className="bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-12">
            {t('how_it_works.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-12">
            <div className="flex items-start gap-4 md:flex-col md:items-center md:text-center md:gap-4">
              <div className="shrink-0 size-12 md:size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="size-6 md:size-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold">
                  {t('how_it_works.browse.title')}
                </h3>
                <p className="text-muted-foreground text-sm mt-1 md:mt-2">
                  {t('how_it_works.browse.desc')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 md:flex-col md:items-center md:text-center md:gap-4">
              <div className="shrink-0 size-12 md:size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="size-6 md:size-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold">
                  {t('how_it_works.read.title')}
                </h3>
                <p className="text-muted-foreground text-sm mt-1 md:mt-2">
                  {t('how_it_works.read.desc')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 md:flex-col md:items-center md:text-center md:gap-4">
              <div className="shrink-0 size-12 md:size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <PenSquare className="size-6 md:size-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold">
                  {t('how_it_works.enroll.title')}
                </h3>
                <p className="text-muted-foreground text-sm mt-1 md:mt-2">
                  {t('how_it_works.enroll.desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
