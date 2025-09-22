import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@uni-feedback/ui'
import { getCurrentSchoolYear, formatSchoolYearString } from '@uni-feedback/utils'
import { type Faculty, type Degree, type Course } from '@uni-feedback/api-client'
import { Form, useFetcher, useSearchParams } from 'react-router'
import { useEffect, useMemo, useState } from 'react'

interface GiveFeedbackContentProps {
  faculties: Faculty[]
  actionData?: {
    success?: boolean
    error?: string
    feedback?: { id: number }
  }
}

export function GiveFeedbackContent({ faculties, actionData }: GiveFeedbackContentProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const fetcher = useFetcher<{ degrees?: Degree[], courses?: Course[], courseDetails?: Course }>()

  // Form state
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [schoolYear, setSchoolYear] = useState(() => {
    const year = searchParams.get('schoolYear')
    return year ? parseInt(year) : getCurrentSchoolYear()
  })
  const [facultyId, setFacultyId] = useState(() => {
    const id = searchParams.get('facultyId')
    return id ? parseInt(id) : 0
  })
  const [degreeId, setDegreeId] = useState(() => {
    const id = searchParams.get('degreeId')
    return id ? parseInt(id) : 0
  })
  const [courseId, setCourseId] = useState(() => {
    const id = searchParams.get('courseId')
    return id ? parseInt(id) : 0
  })
  const [rating, setRating] = useState(0)
  const [workloadRating, setWorkloadRating] = useState(0)
  const [comment, setComment] = useState('')

  // Derived data
  const degrees = fetcher.data?.degrees || []
  const courses = fetcher.data?.courses || []
  const selectedFaculty = useMemo(() =>
    faculties.find(f => f.id === facultyId) || null,
    [faculties, facultyId]
  )

  // Generate school years
  const schoolYears = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => getCurrentSchoolYear() - i),
    []
  )

  // Load degrees when faculty changes
  useEffect(() => {
    if (facultyId && facultyId > 0) {
      fetcher.load(`/feedback/new?facultyId=${facultyId}`)
    }
  }, [facultyId])

  // Load courses when degree changes
  useEffect(() => {
    if (degreeId && degreeId > 0) {
      fetcher.load(`/feedback/new?degreeId=${degreeId}`)
    }
  }, [degreeId])

  // Handle faculty change
  const handleFacultyChange = (value: string) => {
    const newFacultyId = parseInt(value)
    setFacultyId(newFacultyId)
    setDegreeId(0)
    setCourseId(0)
  }

  // Handle degree change
  const handleDegreeChange = (value: string) => {
    const newDegreeId = parseInt(value)
    setDegreeId(newDegreeId)
    setCourseId(0)
  }

  // Get email placeholder
  const emailPlaceholder = useMemo(() => {
    if (selectedFaculty?.emailSuffixes && selectedFaculty.emailSuffixes.length > 0) {
      return `your.email${selectedFaculty.emailSuffixes[0]}`
    }
    return 'your.email@university.com'
  }, [selectedFaculty])

  // Show success state
  if (actionData?.success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for sharing your course experience. Your feedback helps fellow students make informed decisions.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <a href="/feedback/new">Submit Another Review</a>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <a href="/">Back to Courses</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Give Course Feedback</h1>
        <p className="text-gray-600">
          Share your honest course experience to help fellow students make informed decisions.
        </p>
      </div>

      {actionData?.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{actionData.error}</p>
        </div>
      )}

      <Form method="post" className="space-y-6">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={emailPlaceholder}
            required
          />
        </div>

        {/* School Year */}
        <div>
          <label htmlFor="schoolYear" className="block text-sm font-medium text-gray-700 mb-2">
            School Year *
          </label>
          <Select value={schoolYear.toString()} onValueChange={(value) => setSchoolYear(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select school year" />
            </SelectTrigger>
            <SelectContent>
              {schoolYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {formatSchoolYearString(year)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="schoolYear" value={schoolYear} />
        </div>

        {/* Faculty */}
        <div>
          <label htmlFor="facultyId" className="block text-sm font-medium text-gray-700 mb-2">
            Faculty *
          </label>
          <Select value={facultyId.toString()} onValueChange={handleFacultyChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select faculty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Select a faculty</SelectItem>
              {faculties.map((faculty) => (
                <SelectItem key={faculty.id} value={faculty.id.toString()}>
                  {faculty.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="facultyId" value={facultyId} />
        </div>

        {/* Degree */}
        <div>
          <label htmlFor="degreeId" className="block text-sm font-medium text-gray-700 mb-2">
            Degree *
          </label>
          <Select value={degreeId.toString()} onValueChange={handleDegreeChange} disabled={!facultyId || degrees.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder={facultyId ? "Select degree" : "First select a faculty"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Select a degree</SelectItem>
              {degrees.map((degree) => (
                <SelectItem key={degree.id} value={degree.id.toString()}>
                  {degree.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="degreeId" value={degreeId} />
        </div>

        {/* Course */}
        <div>
          <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-2">
            Course *
          </label>
          <Select value={courseId.toString()} onValueChange={(value) => setCourseId(parseInt(value))} disabled={!degreeId || courses.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder={degreeId ? "Select course" : "First select a degree"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Select a course</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.acronym} - {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="courseId" value={courseId} />
        </div>

        {/* Rating */}
        <div>
          <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
            Overall Rating *
          </label>
          <Select value={rating.toString()} onValueChange={(value) => setRating(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Rate the course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Select rating</SelectItem>
              <SelectItem value="1">⭐ 1 - Poor</SelectItem>
              <SelectItem value="2">⭐⭐ 2 - Fair</SelectItem>
              <SelectItem value="3">⭐⭐⭐ 3 - Good</SelectItem>
              <SelectItem value="4">⭐⭐⭐⭐ 4 - Very Good</SelectItem>
              <SelectItem value="5">⭐⭐⭐⭐⭐ 5 - Excellent</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" name="rating" value={rating} />
        </div>

        {/* Workload Rating */}
        <div>
          <label htmlFor="workloadRating" className="block text-sm font-medium text-gray-700 mb-2">
            Workload Rating *
          </label>
          <Select value={workloadRating.toString()} onValueChange={(value) => setWorkloadRating(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Rate the workload" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Select workload</SelectItem>
              <SelectItem value="1">🟢 1 - Very Light</SelectItem>
              <SelectItem value="2">🟡 2 - Light</SelectItem>
              <SelectItem value="3">🟠 3 - Moderate</SelectItem>
              <SelectItem value="4">🔴 4 - Heavy</SelectItem>
              <SelectItem value="5">🔴 5 - Very Heavy</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" name="workloadRating" value={workloadRating} />
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Comments
          </label>
          <Textarea
            id="comment"
            name="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this course (optional)"
            rows={4}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={!email || !schoolYear || !facultyId || !degreeId || !courseId || !rating || !workloadRating}
        >
          Submit Feedback
        </Button>
      </Form>
    </div>
  )
}