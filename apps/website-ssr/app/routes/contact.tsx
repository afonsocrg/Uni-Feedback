import { Mail } from 'lucide-react'

export function meta() {
  return [
    { title: 'Contact | Uni Feedback' },
    {
      name: 'description',
      content: 'Get in touch with the Uni Feedback team'
    }
  ]
}

export default function ContactPage() {
  return (
    <div>
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-xl mx-auto flex gap-6">
          <div className="bg-primary/10 rounded-full p-4 shrink-0 self-start">
            <Mail className="size-10 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-semibold mb-4">
              Get in touch
            </h1>

            <p className="text-muted-foreground mb-8 leading-relaxed">
              Found a bug? Have an idea for a new feature? Or just want to say
              hi and share how Uni Feedback has helped you? Drop me an email at{' '}
              <a
                href="mailto:afonso@uni-feedback.com"
                className="text-foreground font-medium hover:underline"
              >
                afonso@uni-feedback.com
              </a>
              ! I read every email and reply as soon as I can.
            </p>

            <a
              href="mailto:afonso@uni-feedback.com"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-6 py-3 rounded-lg font-medium"
            >
              <Mail className="size-4" />
              Email me
            </a>
            <p className="text-xs text-muted-foreground mt-3"></p>
          </div>
        </div>
      </div>
    </div>
  )
}
