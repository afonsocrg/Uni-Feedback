import { Button } from '@uni-feedback/ui'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { getLocalePath, type Lang } from '~/utils/i18n-routes'

export function GiveawayRecapCTA() {
  const { i18n } = useTranslation()
  const lang = i18n.language as Lang

  return (
    <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-6">
            Let's keep this momentum going!
          </h2>

          <p className="text-muted-foreground mb-8">
            Even without prizes, your feedback still matters.
          </p>

          <div className="flex justify-center">
            <Button asChild size="lg" className="group">
              <Link to={getLocalePath('browse', lang)}>
                Share your experience
                <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
