import { Heart } from 'lucide-react'
import { getAssetUrl } from '~/utils'

export function GiveawayRecapThankYou() {
  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid md:grid-cols-[300px_1fr] gap-8 md:gap-12 items-center">
            {/* Left side - Thank you heading */}
            <div className="text-center">
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Thank You!!
              </h2>
              <div className="flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Heart className="size-8 text-primary fill-primary" />
                </div>
              </div>
            </div>

            {/* Right side - Message */}
            <div className="space-y-4 md:text-lg text-muted-foreground">
              <p>
                Words can't express how happy it makes me to see so many
                students joining this initiative and helping each other.
              </p>

              <p className="text-medium md:text-xl font-semibold text-foreground">
                Together, we're building a platform that will help{' '}
                <span className="text-primary">thousands of students</span> know
                how courses really are, make better choices, and prepare better
                for their semester.
              </p>

              <p>
                The feedback you shared is helping students make better
                decisions today, and will continue guiding them in the years to
                come.
              </p>

              <p className="font-medium text-foreground">Let that sink in...</p>

              <div className="pt-4 flex items-center gap-4">
                <img
                  src={getAssetUrl('giveaway/afonsocrg.jpeg')}
                  alt="Afonso"
                  className="size-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-lg md:text-xl font-semibold text-foreground">
                    A huge thanks to everyone who contributed!!
                  </p>
                  <p className="text-sm text-muted-foreground italic">
                    — Afonso
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
