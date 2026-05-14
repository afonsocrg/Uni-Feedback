import { Popover, PopoverContent, PopoverTrigger } from '@uni-feedback/ui'
import { ClipboardCheck, EyeOff, Info, Shield, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function TrustSection() {
  const { t } = useTranslation('landing')

  const items = [
    {
      Icon: Shield,
      heading: t('trust.space.title'),
      body: t('trust.space.desc')
    },
    {
      Icon: UserCheck,
      heading: t('trust.real_students.title'),
      body: t('trust.real_students.desc')
    },
    {
      Icon: EyeOff,
      heading: t('trust.anonymous_submissions.title'),
      body: t('trust.anonymous_submissions.desc'),
      finePrint: t('trust.anonymous_submissions.note')
    },
    {
      Icon: ClipboardCheck,
      heading: t('trust.reviewed.title'),
      body: t('trust.reviewed.desc')
    }
  ]

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 md:gap-14">
          {items.map((item) => (
            <div key={item.heading} className="space-y-3">
              <item.Icon className="size-6 text-primary" />
              <h3 className="font-semibold text-lg">{item.heading}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {item.body}
                {item.finePrint && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="inline-flex items-center ml-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors align-middle cursor-pointer">
                        <Info className="size-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="text-xs text-muted-foreground leading-relaxed">
                      {item.finePrint}
                    </PopoverContent>
                  </Popover>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
