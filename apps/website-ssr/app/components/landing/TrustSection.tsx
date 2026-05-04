const TRUST_ITEMS = [
  {
    heading: 'Your privacy is guaranteed',
    body: 'We never show who wrote what. Your name, your email, your identity — none of it is ever visible to other students. You can speak freely.'
  },
  {
    heading: 'Only verified students can review',
    body: 'Every reviewer signs in with their institutional email. No anonymous trolls. No fake reviews. Every opinion you read comes from a real student.'
  },
  {
    heading: 'Every review is personally read by our team',
    body: 'We read every single submission before it goes live. Out of 1,900+ reviews, fewer than 10 were ever removed. The community speaks for itself.'
  }
]

export function TrustSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-16">
          {TRUST_ITEMS.map((item, i) => (
            <div
              key={item.heading}
              className={`flex flex-col md:flex-row gap-6 md:gap-12 items-start ${
                i % 2 === 1 ? 'md:flex-row-reverse' : ''
              }`}
            >
              <div className="md:w-1/2 space-y-3">
                <h3 className="font-heading text-xl md:text-2xl font-semibold tracking-tight">
                  {item.heading}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.body}
                </p>
              </div>
              {/* Decorative number */}
              <div className="md:w-1/2 flex items-center justify-center">
                <span className="text-8xl font-bold text-muted/30 select-none">
                  0{i + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
