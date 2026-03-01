import { BookOpen, GraduationCap, MessageSquare, Users } from 'lucide-react'

export function GiveawayRecapHero() {
  return (
    <>
      {/* Hero Banner with Image */}
      <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/giveaway/image_1.jpg')" }}
        />

        {/* Dark Overlay for contrast */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-16 text-center text-white">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight drop-shadow-lg">
              Giveaway Recap
            </h1>
            <p className="text-xl md:text-2xl text-white/90 drop-shadow-md">
              The giveaway ended on February 27th. Here's what we accomplished
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12">
              Together we collected:
            </h2>

            <div className="space-y-6 text-base md:text-lg">
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <MessageSquare className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <span className="font-bold text-2xl md:text-3xl text-primary">
                    1,144
                  </span>
                  <span className="text-foreground/80"> feedbacks, from</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Users className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <span className="font-bold text-2xl md:text-3xl text-primary">
                    274
                  </span>
                  <span className="text-foreground/80">
                    {' '}
                    students, covering
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <BookOpen className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <span className="font-bold text-2xl md:text-3xl text-primary">
                    521
                  </span>
                  <span className="text-foreground/80"> courses from</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <GraduationCap className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <span className="font-bold text-2xl md:text-3xl text-primary">
                    52
                  </span>
                  <span className="text-foreground/80"> degrees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
