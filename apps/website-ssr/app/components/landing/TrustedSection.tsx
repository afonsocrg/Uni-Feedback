import { CheckCircle, ShieldCheck, UserX } from 'lucide-react'

const COPY = {
  badge: 'Trusted & Secure',
  heading: 'Reviews You Can Trust',
  features: [
    {
      title: 'Verified Feedback',
      description:
        'We manually review and approve every feedback submitted to ensure it comes from a student who actually took the course. This guarantees the information you read is real.'
    },
    {
      title: '100% Anonymous',
      description:
        'Your identity is completely protected. We never attach your name, email, or student ID to your feedback, and we do not disclose any personal information to the university, faculty, or any third party.'
    }
  ]
}

export function TrustedSection() {
  return (
    <section id="trusted-and-secure" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <ShieldCheck className="size-4" />
                {COPY.badge}
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
                {COPY.heading}
              </h2>
              <div className="space-y-4 pt-4">
                <div className="flex gap-4">
                  <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="size-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      {COPY.features[0].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {COPY.features[0].description}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UserX className="size-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      {COPY.features[1].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {COPY.features[1].description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl" />
              <img
                alt="Students collaborating"
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
