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
  latestSchoolYear: string | null
  latestSemester: string | null
  latestExecutionLabel: string | null
  latestExecutionUrl: string | null
}

interface CourseProfessorsProps {
  course: {
    teachers?: CourseTeacher[]
  }
}

export function CourseProfessors({ course }: CourseProfessorsProps) {
  const { t } = useTranslation('course')
  const lang = useLang()
  const teachers = course.teachers ?? []
  const currentSchoolYear = formatSchoolYearString(getCurrentSchoolYear(), {
    yearFormat: 'long'
  })
  const currentTeachers = teachers.filter(
    (teacher) => teacher.latestSchoolYear === currentSchoolYear
  )
  const pastTeachers = teachers.filter(
    (teacher) => teacher.latestSchoolYear !== currentSchoolYear
  )

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          {t('tabs.professors')}
        </h2>
      </div>

      {teachers.length > 0 ? (
        <div className="space-y-8">
          <CourseProfessorSection
            title={t('professors.current_professors')}
            teachers={currentTeachers}
            showLatestExecution={false}
            emptyText={t('professors.no_current_professors')}
            lang={lang}
          />
          <CourseProfessorSection
            title={t('professors.past_professors')}
            teachers={pastTeachers}
            showLatestExecution
            emptyText={t('professors.no_past_professors')}
            lang={lang}
          />
        </div>
      ) : (
        <p className="text-gray-600 italic">{t('professors.no_content')}</p>
      )}
    </div>
  )
}

function CourseProfessorSection({
  title,
  teachers,
  showLatestExecution,
  emptyText,
  lang
}: {
  title: string
  teachers: CourseTeacher[]
  showLatestExecution: boolean
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
            const latestExecution =
              teacher.latestExecutionLabel ||
              [teacher.latestSchoolYear, teacher.latestSemester]
                .filter(Boolean)
                .join(' - ')

            return (
              <Link
                key={teacher.id}
                to={getTeacherPath(lang, teacher.id)}
                className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{teacher.name}</p>
                  {showLatestExecution && latestExecution && (
                    <p className="mt-1 text-sm text-gray-500">
                      {t('professors.latest_execution', {
                        execution: latestExecution
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
