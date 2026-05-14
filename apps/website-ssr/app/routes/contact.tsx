import { Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation('legal')

  return (
    <div>
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-xl mx-auto flex gap-6">
          <div className="bg-primary/10 rounded-full p-4 shrink-0 self-start">
            <Mail className="size-10 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-semibold mb-4">
              {t('contact.title')}
            </h1>

            <p className="text-muted-foreground mb-8 leading-relaxed">
              {t('contact.desc')}
            </p>

            <a
              href="mailto:afonso@uni-feedback.com"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-6 py-3 rounded-lg font-medium"
            >
              <Mail className="size-4" />
              {t('contact.email_btn')}
            </a>
            <p className="text-xs text-muted-foreground mt-3"></p>
          </div>
        </div>
      </div>
    </div>
  )
}
