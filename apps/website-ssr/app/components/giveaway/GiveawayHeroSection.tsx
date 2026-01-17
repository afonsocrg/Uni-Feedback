import { Button } from '@uni-feedback/ui'
import { ArrowRight } from 'lucide-react'

export function GiveawayHeroSection() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/giveaway/image_1.jpg')" }}
      />

      {/* Dark Overlay for contrast */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-24 text-center text-white">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight drop-shadow-lg">
            Win a ticket to{' '}
            <span className="whitespace-nowrap">NOS Alive 2026!</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 drop-shadow-md">
            Share your feedback. Help others choose better!
          </p>
          <div className="pt-4">
            <Button
              size="lg"
              className="text-lg px-8 bg-white text-black hover:bg-white/90 shadow-xl"
              asChild
            >
              <a href="#how-to-win">
                How to Win
                <ArrowRight className="size-5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
