import { Button } from '@uni-feedback/ui'

export function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-[560px] mx-auto text-center space-y-6">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
            One review.
            <br />
            Helps students forever.
          </h2>
          <p className="text-muted-foreground text-base">
            It takes 2 minutes. Your name stays private.
          </p>
          <Button size="lg" className="text-base px-8 mt-2" asChild>
            <a href="/feedback/new">Leave your review</a>
          </Button>
          <p className="text-xs text-muted-foreground/60">
            Takes 2 minutes · 100% anonymous · Read by real students
          </p>
        </div>
      </div>
    </section>
  )
}
