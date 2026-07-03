import { Markdown } from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'

interface CourseBibliographyProps {
  course: {
    bibliography?: string | null
  }
}

export function CourseBibliography({ course }: CourseBibliographyProps) {
  const { t } = useTranslation('course')
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-semibold text-foreground">
          {t('tabs.bibliography')}
        </h2>
      </div>
      {course.bibliography ? (
        <Markdown>{course.bibliography}</Markdown>
      ) : (
        <p className="text-muted-foreground italic">
          {t('bibliography.no_content')}
        </p>
      )}
    </div>
  )
}
