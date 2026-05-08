import { Popover, PopoverContent, PopoverTrigger } from '@uni-feedback/ui'
import type { LucideIcon } from 'lucide-react'
import { ClipboardCheck, EyeOff, Info, Shield, UserCheck } from 'lucide-react'
import type { ReactNode } from 'react'

interface TrustItem {
  Icon: LucideIcon
  heading: string
  body: ReactNode
  finePrint?: string
}

const TRUST_ITEMS: TrustItem[] = [
  {
    Icon: Shield,
    heading: 'A space that belongs to students',
    body: (
      <>
        Uni Feedback is student-run and{' '}
        <strong>independent from any university</strong>. No institution can
        influence what gets published here. Here you&apos;ll find the good, the
        bad, and the ugly.
      </>
    )
  },
  {
    Icon: UserCheck,
    heading: 'Only real students, from real universities',
    body: (
      <>
        We want our feedback to be legit. Every contributor authenticates with
        their <strong>university email</strong> before submitting.
      </>
    )
  },
  {
    Icon: EyeOff,
    heading: 'Your feedback is 100% anonymous',
    body: (
      <>
        We want students to feel safe sharing their experience.{' '}
        <strong>Nobody</strong>, not other students, not professors, not your
        university, will ever know you wrote it.
      </>
    ),
    finePrint:
      'Internally, your submission is linked to your account so you can manage it, and so our team can reach out if something needs attention. That link never leaves Uni Feedback.'
  },
  {
    Icon: ClipboardCheck,
    heading: 'All feedback is reviewed',
    body: (
      <>
        We read <em>every</em> submission. If something doesn&apos;t follow our
        guidelines, we remove it and reach out to help the author update it, so
        it can go back up.
        <br />
        Every opinion is welcome. <strong>All of them.</strong>
      </>
    )
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
                {item.finePrint && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="inline-flex items-center ml-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors align-middle cursor-pointer">
                        <Info className="size-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="text-xs text-muted-foreground leading-relaxed">
                      {item.finePrint}
                    </PopoverContent>
                  </Popover>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
