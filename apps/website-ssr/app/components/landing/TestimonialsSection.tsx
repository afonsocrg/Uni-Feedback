import type { Testimonial } from '@uni-feedback/db'
import { getAssetUrl } from '~/utils'
import { TestimonialCard } from './TestimonialCard'

interface TestimonialsSectionProps {
  testimonials: Testimonial[]
}

export function TestimonialsSection({
  testimonials
}: TestimonialsSectionProps) {
  return (
    <section id="testimonials" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-4">
            What Students Say
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Hear from students who have used Uni Feedback to make better course
            decisions
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

          {/* Testimonial CTA */}
          <div className="text-center mt-4 text-sm">
            <p className="text-muted-foreground">
              Want to share your experience?{' '}
              <a
                href="mailto:testimonials@uni-feedback.com"
                className="text-primary hover:underline font-medium"
              >
                Send us your testimonial
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
