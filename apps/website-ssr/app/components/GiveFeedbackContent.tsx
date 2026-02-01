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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  WorkloadRatingDisplay
} from '@uni-feedback/ui'
import {
  formatSchoolYearString,
  getCurrentSchoolYear
} from '@uni-feedback/utils'
import { Check, ChevronsUpDown, Loader2, Send } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Link } from 'react-router'
import { CommentSection } from '~/components'
import { AuthenticatedButton } from '~/components/common'
import { useDegreeCourses, useFacultyDegrees } from '~/hooks/queries'
import { useAuth } from '~/hooks/useAuth'
import type { FeedbackFormData } from '~/routes/feedback.new'
import { analytics } from '~/utils/analytics'
import { cn } from '~/utils/tailwind'

interface GiveFeedbackContentProps {
  faculties: Faculty[]
  form: UseFormReturn<FeedbackFormData>
  onSubmit: (values: FeedbackFormData) => Promise<void>
  isSubmitting: boolean
}

export function GiveFeedbackContent({
  faculties,
  form,
  onSubmit,
  isSubmitting
}: GiveFeedbackContentProps) {
  const { user } = useAuth()

  // Popover open states
  const [facultyOpen, setFacultyOpen] = useState(false)
  const [degreeOpen, setDegreeOpen] = useState(false)
  const [courseOpen, setCourseOpen] = useState(false)

  // Track if ratings have been tracked to prevent duplicates
  const ratingsTrackedRef = useRef(false)

  // Watch only the fields needed for conditional rendering and data fetching
  const selectedFacultyId = form.watch('facultyId')
  const selectedDegreeId = form.watch('degreeId')
  const selectedCourseId = form.watch('courseId')
  const rating = form.watch('rating')
  const workloadRating = form.watch('workloadRating')

  // Check if all required fields are filled
  const isFormValid = useMemo(() => {
    return (
      selectedFacultyId > 0 &&
      selectedDegreeId > 0 &&
      selectedCourseId > 0 &&
      rating > 0 &&
      workloadRating > 0
    )
  }, [
    selectedFacultyId,
    selectedDegreeId,
    selectedCourseId,
    rating,
    workloadRating
  ])

  // Get list of missing required fields
  const missingFields = useMemo(() => {
    const missing: string[] = []
    if (selectedFacultyId === 0) missing.push('University')
    if (selectedDegreeId === 0) missing.push('Degree')
    if (selectedCourseId === 0) missing.push('Course')
    if (rating === 0) missing.push('Overall Rating')
    if (workloadRating === 0) missing.push('Workload')
    return missing
  }, [
    selectedFacultyId,
    selectedDegreeId,
    selectedCourseId,
    rating,
    workloadRating
  ])

  // Get the selected faculty for auth modal customization
  const selectedFaculty = useMemo(
    () => faculties.find((f) => f.id === selectedFacultyId),
    [faculties, selectedFacultyId]
  )

  // Fetch degrees and courses based on selections
  const { data: degrees = [], isLoading: isLoadingDegrees } = useFacultyDegrees(
    selectedFacultyId > 0 ? selectedFacultyId : null
  )

  const { data: courses = [], isLoading: isLoadingCourses } = useDegreeCourses(
    selectedDegreeId > 0 ? selectedDegreeId : null
  )

  // Generate school years
  const schoolYears = useMemo(
    () => Array.from({ length: 5 }, (_, i) => getCurrentSchoolYear() - i),
    []
  )

  // Track when both ratings are entered
  useEffect(() => {
    if (rating > 0 && workloadRating > 0 && !ratingsTrackedRef.current) {
      analytics.feedback.ratingsEntered({
        rating,
        workloadRating
      })
      ratingsTrackedRef.current = true
    }
  }, [rating, workloadRating])

  // Reset dependent selections when parent selections change
  useEffect(() => {
    const currentDegreeId = form.getValues('degreeId')
    if (
      currentDegreeId &&
      degrees.length > 0 &&
      !degrees.some((d) => d.id === currentDegreeId)
    ) {
      form.setValue('degreeId', 0, { shouldValidate: true })
      form.setValue('courseId', 0, { shouldValidate: true })
    }
  }, [degrees, form])

  useEffect(() => {
    const currentCourseId = form.getValues('courseId')
    if (
      currentCourseId &&
      courses.length > 0 &&
      !courses.some((c) => c.id === currentCourseId)
    ) {
      form.setValue('courseId', 0, { shouldValidate: true })
    }
  }, [courses, form])

  // Conditional field visibility
  const showDegreeField = selectedFacultyId > 0
  const showCourseField =
    selectedDegreeId > 0 && degrees?.some((d) => d.id === selectedDegreeId)

  // Check if logged-in user's email matches the selected faculty
  const universityMismatchWarning = useMemo(() => {
    if (!user || !selectedFacultyId) return null

    const selectedFaculty = faculties.find((f) => f.id === selectedFacultyId)
    if (!selectedFaculty?.emailSuffixes?.length) return null

    const userEmailDomain = user.email.split('@')[1]?.toLowerCase()
    if (!userEmailDomain) return null

    const isValidDomain = selectedFaculty.emailSuffixes.some(
      (suffix) => userEmailDomain === suffix.toLowerCase()
    )

    if (isValidDomain) return null

    // Find the user's actual faculty
    const userFaculty = faculties.find((f) =>
      f.emailSuffixes?.some(
        (suffix) => userEmailDomain === suffix.toLowerCase()
      )
    )

    return userFaculty
      ? `You can only submit feedback to ${userFaculty.shortName} (your university).`
      : `Your email domain (@${userEmailDomain}) doesn't match this university.`
  }, [user, selectedFacultyId, faculties])

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl min-h-screen">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          Leave your Feedback!
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Faculty, Degree, Course */}
            <div className="flex flex-wrap gap-2">
              <div className="flex flex-wrap gap-2 justify-start">
                {/* Faculty */}
                <FormField
                  name="facultyId"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col w-[200px]">
                      <FormLabel>
                        University
                        {!selectedFacultyId && (
                          <span className="text-red-500">*</span>
                        )}
                      </FormLabel>
                      <Popover open={facultyOpen} onOpenChange={setFacultyOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                'w-[200px] justify-between font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {faculties?.find((f) => f.id === field.value)
                                ?.shortName ?? 'Select university'}
                              <ChevronsUpDown className="opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search university..."
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>
                                No universities found.
                              </CommandEmpty>
                              <CommandGroup>
                                {faculties?.map((f) => (
                                  <CommandItem
                                    value={`${f.shortName} - ${f.name}`}
                                    key={f.id}
                                    onSelect={() => {
                                      form.setValue('facultyId', f.id)
                                      form.setValue('degreeId', 0)
                                      form.setValue('courseId', 0)
                                      setFacultyOpen(false)

                                      // Track faculty selection
                                      analytics.feedback.facultySelected({
                                        facultyId: f.id,
                                        facultyName: f.shortName
                                      })
                                    }}
                                  >
                                    {f.shortName}
                                    <Check
                                      className={cn(
                                        'ml-auto',
                                        f.id === field.value
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
                      {universityMismatchWarning && (
                        <p className="text-sm text-amber-600">
                          {universityMismatchWarning}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Degree */}
                {showDegreeField && (
                  <FormField
                    name="degreeId"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>
                          Degree
                          {!selectedDegreeId && (
                            <span className="text-red-500">*</span>
                          )}
                        </FormLabel>
                        <Popover open={degreeOpen} onOpenChange={setDegreeOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  'w-[200px] justify-between font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {degrees?.find((d) => d.id === field.value)
                                  ?.acronym ?? 'Select degree'}
                                <ChevronsUpDown className="opacity-50" />
                              </Button>
                            </FormControl>
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
                                      onSelect={() => {
                                        form.setValue('degreeId', d.id)
                                        form.setValue('courseId', 0)
                                        setDegreeOpen(false)

                                        // Track degree selection
                                        analytics.feedback.degreeSelected({
                                          degreeId: d.id,
                                          degreeName: d.acronym,
                                          facultyId: selectedFacultyId
                                        })
                                      }}
                                    >
                                      {d.acronym} - {d.name}
                                      <Check
                                        className={cn(
                                          'ml-auto',
                                          d.id === field.value
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Course */}
                {showCourseField && (
                  <FormField
                    name="courseId"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>
                          Course
                          {selectedDegreeId && !field.value && (
                            <span className="text-red-500">*</span>
                          )}
                        </FormLabel>
                        <Popover open={courseOpen} onOpenChange={setCourseOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  'w-[200px] justify-between truncate font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <span className="truncate overflow-hidden whitespace-nowrap flex-1 text-left">
                                  {courses.find((c) => c.id === field.value)
                                    ?.name ?? 'Select course'}
                                </span>
                                <ChevronsUpDown className="opacity-50 flex-shrink-0 ml-2" />
                              </Button>
                            </FormControl>
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
                                      onSelect={() => {
                                        form.setValue('courseId', c.id)
                                        setCourseOpen(false)

                                        // Track course selection
                                        analytics.feedback.courseSelected({
                                          courseId: c.id,
                                          courseName: c.acronym,
                                          degreeId: selectedDegreeId
                                        })
                                      }}
                                    >
                                      {c.acronym} - {c.name}
                                      <Check
                                        className={cn(
                                          'ml-auto',
                                          c.id === field.value
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* School Year */}
            <div className="flex flex-wrap gap-2">
              <FormField
                name="schoolYear"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>When did you take this course?</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(val) => field.onChange(Number(val))}
                        value={field.value.toString()}
                      >
                        <SelectTrigger className="w-[200px] bg-white">
                          <SelectValue placeholder="Select a school year" />
                        </SelectTrigger>
                        <SelectContent>
                          {schoolYears.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {formatSchoolYearString(year, {
                                yearFormat: 'long'
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Ratings */}
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4">
                {/* Overall Rating */}
                <div className="min-w-[220px]">
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Overall Rating
                          {!field.value && (
                            <span className="text-red-500">*</span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <EditableStarRating
                            value={field.value}
                            onChange={field.onChange}
                            size="lg"
                            labelPosition="bottom"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Workload Rating */}
                <div className="min-w-[220px]">
                  <FormField
                    control={form.control}
                    name="workloadRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Workload
                          {!field.value && (
                            <span className="text-red-500">*</span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(val) => field.onChange(Number(val))}
                            value={field.value?.toString() || ''}
                          >
                            <SelectTrigger className="w-full bg-white min-h-[40px]">
                              <SelectValue placeholder="Select workload rating">
                                {field.value ? (
                                  <WorkloadRatingDisplay rating={field.value} />
                                ) : null}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {[5, 4, 3, 2, 1].map((rating) => (
                                <SelectItem
                                  key={rating}
                                  value={rating.toString()}
                                >
                                  <WorkloadRatingDisplay rating={rating} />
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Comment Section - Isolated to prevent parent re-renders */}
            <div className="space-y-6">
              <CommentSection control={form.control} />
            </div>

            {/* Submit Button */}
            <div className="mt-6 mb-0 space-y-4">
              {/* Validation feedback */}
              {!isFormValid && missingFields.length > 0 && (
                <div className="text-sm text-muted-foreground text-center">
                  Please fill in the following required fields:{' '}
                  <span className="font-semibold">
                    {missingFields.join(', ')}
                  </span>
                </div>
              )}

              <AuthenticatedButton
                type="submit"
                className="w-full"
                disabled={isSubmitting || !isFormValid}
                authModalProps={{
                  allowedEmailSuffixes: selectedFaculty?.emailSuffixes,
                  universityName: selectedFaculty?.shortName,
                  successDescription: 'Submitting your feedback...'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    <span>Submit</span>
                  </>
                )}
              </AuthenticatedButton>
            </div>

            <p className="text-xs text-gray-500 text-center mt-1">
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
          </form>
        </Form>
      </div>
    </main>
  )
}
