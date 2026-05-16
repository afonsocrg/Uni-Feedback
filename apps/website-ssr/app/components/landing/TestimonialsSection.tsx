import type { Testimonial } from '@uni-feedback/db'
import { useTranslation } from 'react-i18next'
import { getAssetUrl } from '~/utils'
import { TestimonialCard } from './TestimonialCard'

interface TestimonialsSectionProps {
  testimonials: Testimonial[]
}

export function TestimonialsSection({
  testimonials
}: TestimonialsSectionProps) {
  const { t } = useTranslation('landing')

  return (
    <section id="testimonials" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-balance">
            {t('testimonials.title')}
          </h2>
          <p className="text-muted-foreground mb-12">
            {t('testimonials.subtitle')}
          </p>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="break-inside-avoid mb-6">
                <TestimonialCard
                  testimonial={testimonial.testimonial}
                  name={testimonial.name}
                  course={testimonial.course}
                  avatarUrl={
                    testimonial.avatarUrl
                      ? getAssetUrl(testimonial.avatarUrl)
                      : undefined
                  }
                  url={testimonial.url ?? undefined}
                />
              </div>
            ))}
          </div>

          <div className="text-center mt-4 text-sm">
            <p className="text-muted-foreground">
              <a
                href="mailto:testimonials@uni-feedback.com"
                className="text-primary hover:underline font-medium"
              >
                {t('testimonials.cta')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
