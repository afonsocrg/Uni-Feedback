import { DegreeCard } from '@/components/degree/DegreeCard'
import { useApp } from '@/hooks'
import { ActionButton, CourseDetailSkeleton, ErrorPanel } from '@components'
import { getCourseIdFromAcronym } from '@services/meicFeedbackAPI'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export function ShortcutRedirect() {
  const navigate = useNavigate()

  const { degree: degreeAcronym, course: courseAcronym } = useParams()
  const { isLoading, degrees, courses } = useApp()
  const [errorType, setErrorType] = useState<'degree' | 'course' | null>(null)

  useEffect(() => {
    const redirectToCourse = async () => {
      if (isLoading) return

      const degree = degrees.find(
        (d) => d.acronym.toLowerCase() === degreeAcronym?.toLowerCase()
      )

      if (!degree) {
        setErrorType('degree')
        return
      }

      if (!courseAcronym) {
        setErrorType('course')
        return
      }

      try {
        const courseId = await getCourseIdFromAcronym(degree.id, courseAcronym!)
        navigate(`/courses/${courseId}`, { replace: true })
      } catch (err) {
        console.error(err)
        setErrorType('course')
      }
    }

    redirectToCourse()
  }, [isLoading, degrees, courses, degreeAcronym, courseAcronym, navigate])

  switch (errorType) {
    case 'degree':
      return <DegreeNotFound acronym={degreeAcronym!} />
    case 'course':
      return (
        <CourseNotFound
          degreeAcronym={degreeAcronym!}
          courseAcronym={courseAcronym!}
        />
      )
    default:
      return <CourseDetailSkeleton />
  }
}

function DegreeNotFound({ acronym }: { acronym: string }) {
  const navigate = useNavigate()
  const { degrees, setSelectedDegreeId } = useApp()
  return (
    <div className="min-h-[60vh] flex flex-col justify-center">
      <ErrorPanel
        headline="Degree not found"
        message={`We couldn't find any degree with the acronym "${acronym}". Select a degree below to browse its courses.`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {degrees.map((degree) => (
            <DegreeCard
              key={degree.id}
              degree={degree}
              onClick={() => {
                setSelectedDegreeId(degree.id)
                navigate('/')
              }}
            />
          ))}
        </div>
      </ErrorPanel>
    </div>
  )
}

function CourseNotFound({
  degreeAcronym,
  courseAcronym
}: {
  degreeAcronym?: string
  courseAcronym?: string
}) {
  const navigate = useNavigate()
  const { degrees, setSelectedDegreeId } = useApp()
  const degree = degrees.find(
    (d) => d.acronym.toLowerCase() === degreeAcronym?.toLowerCase()
  )
  return (
    <div className="min-h-[60vh] flex flex-col justify-center">
      <ErrorPanel
        headline="Course not found"
        message={
          degree && courseAcronym
            ? `We couldn't find the course "${courseAcronym}" in ${degree.acronym}.`
            : `We couldn't find the course you were looking for.`
        }
      >
        <ActionButton
          onClick={() => {
            if (degree) setSelectedDegreeId(degree.id)
            navigate('/')
          }}
          label={`Browse ${degree?.acronym} courses`}
          variant="primary"
        />
      </ErrorPanel>
    </div>
  )
}
