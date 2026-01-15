import { LogIn, PenSquare, Trophy } from 'lucide-react'

const STEPS = [
  {
    icon: LogIn,
    title: 'Login',
    description: (
      <p>
        Use your university email. That’s it!
        <br />
        No passwords, no stress.
      </p>
    )
  },
  {
    icon: PenSquare,
    title: 'Give Feedback',
    description:
      'Share your thoughts on any course you took this year. Good, bad, or "meh".'
  },
  {
    icon: Trophy,
    title: 'Earn Points',
    description: (
      <p>
        Every feedback gives you points.
        <br />
        More points = More chances to win!
      </p>
    )
  }
]

export function HowToWinSection() {
  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-8">
            How to Win
          </h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-12">
            {STEPS.map((step, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <step.icon className="size-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
