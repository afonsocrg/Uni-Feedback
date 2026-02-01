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
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 text-white">
          <div className="flex items-center gap-6 text-center md:text-left">
            <div className="flex items-center justify-center size-16 md:size-20 rounded-full bg-white/10 backdrop-blur-sm">
              <Gift className="size-8 md:size-10" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2">
                Win a ticket to NOS Alive 2026!
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-white/90">
                Share your feedback to enter our giveaway
              </p>
            </div>
          </div>

          <Button
            size="lg"
            className="bg-white text-black hover:bg-white/90 shadow-xl shrink-0 text-lg px-8 py-2 h-auto"
            asChild
          >
            <Link to="/giveaway">
              Learn More
              <ArrowRight className="size-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
