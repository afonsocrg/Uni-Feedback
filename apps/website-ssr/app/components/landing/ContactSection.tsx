import { Button } from '@uni-feedback/ui'
import { Linkedin, Mail } from 'lucide-react'

export function ContactSection() {
  return (
    <section id="contact" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
            Get in Touch
          </h2>
          <p className="text-muted-foreground">
            Found a bug? Have a suggestion? Just want to say hi? I'd love to
            hear from you. Your <span className="whitespace-nowrap">feedback (😉)</span> helps make Uni Feedback better for
            everyone.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" variant="default" className="px-8" asChild>
              <a href="mailto:afonso@uni-feedback.com">
                <Mail className="size-5" />
                Email Me
              </a>
            </Button>
            <Button size="lg" variant="outline" className="px-8" asChild>
              <a
                href="https://www.linkedin.com/in/afonsocrg"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="size-5" />
                Connect on LinkedIn
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
