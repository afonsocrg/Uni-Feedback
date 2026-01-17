import { Button } from '@uni-feedback/ui'
import { ArrowRight, Gift } from 'lucide-react'
import { Link } from 'react-router'

export function GiveawayPromoSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/giveaway/image_1.jpg')" }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 text-white">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="hidden md:flex items-center justify-center size-12 rounded-full bg-white/10 backdrop-blur-sm">
              <Gift className="size-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold tracking-tight">
                Win a ticket to NOS Alive 2026!
              </h2>
              <p className="text-sm md:text-base text-white/80">
                Share your feedback to enter our giveaway
              </p>
            </div>
          </div>

          <Button
            size="lg"
            className="bg-white text-black hover:bg-white/90 shadow-lg shrink-0"
            asChild
          >
            <Link to="/giveaway">
              Learn More
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
