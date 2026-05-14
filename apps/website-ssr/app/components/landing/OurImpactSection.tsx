import { Card, CardContent } from '@uni-feedback/ui'
import { BookOpen, Pen, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function OurImpactSection() {
  const { t } = useTranslation('landing')

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            {t('impact.title')}
          </h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t('impact.subtitle')}
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="text-center space-y-2">
                <div className="size-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="size-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary">502+</div>
                <div className="text-sm text-muted-foreground">
                  {t('impact.courses_reviewed')}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center space-y-2">
                <div className="size-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="size-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary">5,000+</div>
                <div className="text-sm text-muted-foreground">
                  {t('impact.students_helped')}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center space-y-2">
                <div className="size-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Pen className="size-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary">1,200+</div>
                <div className="text-sm text-muted-foreground">
                  {t('impact.contributors')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
