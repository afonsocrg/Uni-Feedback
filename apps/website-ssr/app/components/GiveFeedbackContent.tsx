import { type Faculty } from '@uni-feedback/api-client'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  EditableStarRating,
  Input,
  MarkdownTextarea,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@uni-feedback/ui'
import {
  formatSchoolYearString,
  getCurrentSchoolYear,
  getWorkloadColor,
  getWorkloadLabel
} from '@uni-feedback/utils'
import {
  Check,
  ChevronsUpDown,
  Clock,
  HelpCircle,
  Loader2,
  Send
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Form, Link, useSearchParams } from 'react-router'
import { useDegreeCourses, useFacultyDegrees } from '~/hooks/queries'
import { cn } from '../utils/tailwind'

interface GiveFeedbackContentProps {
  faculties: Faculty[]
  actionData?: {
    success?: boolean
    error?: string
    feedback?: { id: number }
  }
}

export function GiveFeedbackContent({
  faculties,
  actionData
}: GiveFeedbackContentProps) {
  const [searchParams, setSearchParams] = useSearchParams()

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
  const [rating, setRating] = useState(() => {
    const r = searchParams.get('rating')
    return r ? parseInt(r) : 0
  })
  const [workloadRating, setWorkloadRating] = useState(() => {
    const w = searchParams.get('workloadRating')
    return w ? parseInt(w) : 0
  })
  const [comment, setComment] = useState(searchParams.get('comment') || '')

  // Use TanStack Query for data fetching
  const { data: degrees = [], isLoading: isLoadingDegrees } = useFacultyDegrees(
    facultyId > 0 ? facultyId : null
  )

  const { data: courses = [], isLoading: isLoadingCourses } = useDegreeCourses(
    degreeId > 0 ? degreeId : null
  )

  const selectedFaculty = useMemo(
    () => faculties.find((f) => f.id === facultyId) || null,
    [faculties, facultyId]
  )

  // Generate school years
  const schoolYears = useMemo(
    () => Array.from({ length: 5 }, (_, i) => getCurrentSchoolYear() - i),
    []
  )

  // Reset dependent selections when parent selections change
  useEffect(() => {
    // If current degreeId is not in the new degrees list, reset it
    if (
      degreeId &&
      degrees.length > 0 &&
      !degrees.some((d) => d.id === degreeId)
    ) {
      setDegreeId(0)
      setCourseId(0)
    }
  }, [degrees, degreeId])

  useEffect(() => {
    // If current courseId is not in the new courses list, reset it
    if (
      courseId &&
      courses.length > 0 &&
      !courses.some((c) => c.id === courseId)
    ) {
      setCourseId(0)
    }
  }, [courses, courseId])

  // Handle faculty change
  const handleFacultyChange = (newFacultyId: number) => {
    setFacultyId(newFacultyId)
    setDegreeId(0)
    setCourseId(0)
    // Update URL params
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('facultyId', newFacultyId.toString())
    newSearchParams.delete('degreeId')
    newSearchParams.delete('courseId')
    setSearchParams(newSearchParams, { replace: true })
  }

  // Handle degree change
  const handleDegreeChange = (newDegreeId: number) => {
    setDegreeId(newDegreeId)
    setCourseId(0)
    // Update URL params
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('degreeId', newDegreeId.toString())
    newSearchParams.delete('courseId')
    setSearchParams(newSearchParams, { replace: true })
  }

  // Handle course change
  const handleCourseChange = (newCourseId: number) => {
    setCourseId(newCourseId)
    // Update URL params
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('courseId', newCourseId.toString())
    setSearchParams(newSearchParams, { replace: true })
  }

  // Get email placeholder
  const emailPlaceholder = useMemo(() => {
    if (
      selectedFaculty?.emailSuffixes &&
      selectedFaculty.emailSuffixes.length > 0
    ) {
      return `your.email@${selectedFaculty.emailSuffixes[0]}`
    }
    return 'your.email@university.com'
  }, [selectedFaculty])

  // Conditional field visibility
  const showDegreeField = useMemo(() => {
    return facultyId > 0
  }, [facultyId])

  const showCourseField = useMemo(() => {
    return degreeId > 0 && degrees?.some((d) => d.id === degreeId)
  }, [degreeId, degrees])

  // Overall loading state
  const isLoadingData = isLoadingDegrees || isLoadingCourses

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      email.trim() !== '' &&
      schoolYear > 0 &&
      facultyId > 0 &&
      degreeId > 0 &&
      courseId > 0 &&
      rating > 0 &&
      workloadRating > 0
    )
  }, [email, schoolYear, facultyId, degreeId, courseId, rating, workloadRating])

  // Show success state
  if (actionData?.success) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Feedback Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for sharing your course experience. Your feedback helps
            fellow students make informed decisions.
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
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          Leave your Feedback!
        </h1>

        {actionData?.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{actionData.error}</p>
          </div>
        )}

        <Form method="post" className="space-y-10">
          <div className="space-y-6">
            {/* Email */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                  {!email && <span className="text-red-500">*</span>}
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label="Email info"
                        className="cursor-pointer"
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-sm">
                      We ask for your email to verify you are a university
                      student. We may contact you about your feedback if needed.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={emailPlaceholder}
                className="bg-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll never share your email with anyone.
              </p>
            </div>

            {/* School Year */}
            <div className="flex flex-wrap gap-2">
              <div>
                <label
                  htmlFor="schoolYear"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  School Year
                  {!schoolYear && <span className="text-red-500">*</span>}
                </label>
                <Select
                  value={schoolYear.toString()}
                  onValueChange={(value) => setSchoolYear(parseInt(value))}
                >
                  <SelectTrigger className="w-[200px] bg-white">
                    <SelectValue placeholder="Select a school year" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {formatSchoolYearString(year, { yearFormat: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="schoolYear" value={schoolYear} />
              </div>
            </div>

            {/* Faculty and Degree */}
            <div className="flex flex-wrap gap-2">
              <div className="flex flex-wrap gap-2 justify-start">
                {/* Faculty */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    University
                    {!facultyId && <span className="text-red-500">*</span>}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          'w-[200px] justify-between font-normal',
                          !facultyId && 'text-muted-foreground'
                        )}
                      >
                        {faculties?.find((f) => f.id === facultyId)
                          ?.shortName ?? 'Select university'}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search university..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No universities found.</CommandEmpty>
                          <CommandGroup>
                            {faculties?.map((f) => (
                              <CommandItem
                                value={`${f.shortName} - ${f.name}`}
                                key={f.id}
                                onSelect={() => handleFacultyChange(f.id)}
                              >
                                {f.shortName}
                                <Check
                                  className={cn(
                                    'ml-auto',
                                    f.id === facultyId
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <input type="hidden" name="facultyId" value={facultyId} />
                </div>

                {/* Degree */}
                {showDegreeField && (
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Degree
                      {!degreeId && <span className="text-red-500">*</span>}
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-[200px] justify-between font-normal',
                            !degreeId && 'text-muted-foreground'
                          )}
                        >
                          {degrees?.find((d) => d.id === degreeId)?.acronym ??
                            'Select degree'}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search degree..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No degrees found.</CommandEmpty>
                            <CommandGroup>
                              {degrees?.map((d) => (
                                <CommandItem
                                  value={`${d.acronym} - ${d.name}`}
                                  key={d.id}
                                  onSelect={() => handleDegreeChange(d.id)}
                                >
                                  {d.acronym} - {d.name}
                                  <Check
                                    className={cn(
                                      'ml-auto',
                                      d.id === degreeId
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <input type="hidden" name="degreeId" value={degreeId} />
                  </div>
                )}

                {/* Course */}
                {showCourseField && (
                  <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course
                      {!courseId && <span className="text-red-500">*</span>}
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-[200px] justify-between truncate font-normal',
                            !courseId && 'text-muted-foreground'
                          )}
                        >
                          <span className="truncate overflow-hidden whitespace-nowrap flex-1 text-left">
                            {courses.find((c) => c.id === courseId)?.name ??
                              'Select course'}
                          </span>
                          <ChevronsUpDown className="opacity-50 flex-shrink-0 ml-2" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search course..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No courses found.</CommandEmpty>
                            <CommandGroup>
                              {courses.map((c) => (
                                <CommandItem
                                  value={`${c.acronym} - ${c.name}`}
                                  key={c.id}
                                  onSelect={() => handleCourseChange(c.id)}
                                >
                                  {c.acronym} - {c.name}
                                  <Check
                                    className={cn(
                                      'ml-auto',
                                      c.id === courseId
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <input type="hidden" name="courseId" value={courseId} />
                  </div>
                )}
              </div>
            </div>

            {/* Ratings */}
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4">
                {/* Overall Rating */}
                <div className="min-w-[220px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Rating
                    {!rating && <span className="text-red-500">*</span>}
                  </label>
                  <EditableStarRating
                    value={rating}
                    onChange={(value) => setRating(value)}
                    size="lg"
                    labelPosition="bottom"
                  />
                  <input type="hidden" name="rating" value={rating} />
                </div>

                {/* Workload Rating */}
                <div className="min-w-[220px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workload Rating
                    {!workloadRating && <span className="text-red-500">*</span>}
                  </label>
                  <Select
                    value={workloadRating?.toString() || ''}
                    onValueChange={(val) => setWorkloadRating(Number(val))}
                  >
                    <SelectTrigger className="w-full bg-white min-h-[40px]">
                      <SelectValue placeholder="Select workload rating">
                        {workloadRating ? (
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getWorkloadColor(workloadRating)}`}
                          >
                            <Clock className="w-3 h-3 mr-1.5" />
                            Workload: ({workloadRating}/5){' '}
                            {getWorkloadLabel(workloadRating)}
                          </div>
                        ) : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <SelectItem key={rating} value={rating.toString()}>
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getWorkloadColor(rating)}`}
                          >
                            <Clock className="w-3 h-3 mr-1.5" />
                            Workload: ({rating}/5) {getWorkloadLabel(rating)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    type="hidden"
                    name="workloadRating"
                    value={workloadRating}
                  />
                </div>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Write your feedback
                </label>
                <MarkdownTextarea
                  id="comment"
                  name="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What should others know about this course?"
                  previewPlaceholder="This is how your feedback will appear on the website"
                />
                <p className="text-gray-500 pl-2 text-sm mt-1">
                  ❤️ This field is optional, but it's the one that helps other
                  students the most!
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full mt-6"
              disabled={!isFormValid || isLoadingData}
            >
              {isLoadingData ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span>Submit</span>
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-3">
              By submitting this review, you agree to our{' '}
              <Link
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primaryBlue hover:text-primaryBlue/80 underline"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primaryBlue hover:text-primaryBlue/80 underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </Form>
      </div>
    </main>
  )
}
