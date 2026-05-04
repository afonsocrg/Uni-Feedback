import type { LucideIcon } from 'lucide-react'
import { ClipboardCheck, EyeOff, Shield, UserCheck } from 'lucide-react'

interface TrustItem {
  Icon: LucideIcon
  heading: string
  body: string
  finePrint?: string
}

const TRUST_ITEMS: TrustItem[] = [
  {
    Icon: Shield,
    heading: 'A space that belongs to students',
    body: 'Uni Feedback is student-run and independent from any university. No institution can influence what gets published here. That means you get the full picture: the good, the bad, and the ugly. Every opinion, from every student who cared enough to share it.'
  },
  {
    Icon: UserCheck,
    heading: 'Only real students, from real universities',
    body: 'We want our feedback to be legit. Every contributor authenticates with their university email before submitting.'
  },
  {
    Icon: EyeOff,
    heading: 'Your feedback is 100% anonymous',
    body: 'We want students to feel safe sharing their experience. Nobody — not other students, not professors, not your university — will ever know you wrote it.',
    finePrint:
      'Internally, your submission is linked to your account so you can manage it, and so our team can reach out if something needs attention. That link never leaves Uni Feedback.'
  },
  {
    Icon: ClipboardCheck,
    heading: 'All feedback is reviewed',
    body: "We read every submission. If something doesn't follow our guidelines, we remove it and reach out to the author to explain why and invite them to update it. Every opinion is welcome. All of them."
  }
]

export function TrustSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 md:gap-14">
          {TRUST_ITEMS.map((item) => (
            <div key={item.heading} className="space-y-3">
              <item.Icon className="size-6 text-primary" />
              <h3 className="font-semibold text-lg">{item.heading}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {item.body}
              </p>
              {item.finePrint && (
                <p className="text-xs text-muted-foreground/70 border-l-2 border-primary/30 pl-3 mt-3">
                  {item.finePrint}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
