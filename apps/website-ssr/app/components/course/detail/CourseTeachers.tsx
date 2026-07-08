import {
  formatSchoolYearString,
  getCurrentSchoolYear
} from '@uni-feedback/utils'
import { Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { getTeacherPath } from '~/utils/i18n-routes'

interface CourseTeacher {
  id: number
  name: string
  email: string | null
  taughtSchoolYears: number[]
}

interface CourseTeachersProps {
  course: {
    teachers?: CourseTeacher[]
  }
}

export function CourseTeachers({ course }: CourseTeachersProps) {
  const { t } = useTranslation('course')
  const lang = useLang()
  const teachers = course.teachers ?? []
  const currentSchoolYear = getCurrentSchoolYear()
  const currentTeachers = teachers.filter((teacher) =>
    teacher.taughtSchoolYears.includes(currentSchoolYear)
  )
  const pastTeachers = teachers.filter(
    (teacher) => !teacher.taughtSchoolYears.includes(currentSchoolYear)
  )

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          {t('tabs.teachers')}
        </h2>
      </div>

      {teachers.length > 0 ? (
        <div className="space-y-8">
          <CourseTeacherSection
            title={t('teachers.current_teachers')}
            teachers={currentTeachers}
            showSchoolYears={false}
            emptyText={t('teachers.no_current_teachers')}
            lang={lang}
          />
          <CourseTeacherSection
            title={t('teachers.past_teachers')}
            teachers={pastTeachers}
            showSchoolYears
            emptyText={t('teachers.no_past_teachers')}
            lang={lang}
          />
        </div>
      ) : (
        <p className="text-gray-600 italic">{t('teachers.no_content')}</p>
      )}
    </div>
  )
}

function CourseTeacherSection({
  title,
  teachers,
  showSchoolYears,
  emptyText,
  lang
}: {
  title: string
  teachers: CourseTeacher[]
  showSchoolYears: boolean
  emptyText: string
  lang: ReturnType<typeof useLang>
}) {
  const { t } = useTranslation('course')

  return (
    <section>
      <h3 className="mb-3 text-lg font-semibold text-gray-800">{title}</h3>

      {teachers.length > 0 ? (
        <div className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
          {teachers.map((teacher) => {
            const schoolYears = formatSchoolYears(teacher.taughtSchoolYears)

            return (
              <Link
                key={teacher.id}
                to={getTeacherPath(lang, teacher.id)}
                className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{teacher.name}</p>
                  {showSchoolYears && schoolYears && (
                    <p className="mt-1 text-sm text-gray-500">
                      {t('teachers.recorded_years', {
                        years: schoolYears
                      })}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-3 text-sm">
                  {teacher.email && (
                    <a
                      href={`mailto:${teacher.email}`}
                      className="inline-flex items-center gap-1.5 text-primaryBlue hover:underline"
                    >
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      {teacher.email}
                    </a>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="text-gray-600 italic">{emptyText}</p>
      )}
    </section>
  )
}

function formatSchoolYears(schoolYears: number[]) {
  return schoolYears
    .map((schoolYear) =>
      formatSchoolYearString(schoolYear, { yearFormat: 'long' })
    )
    .join(', ')
}
