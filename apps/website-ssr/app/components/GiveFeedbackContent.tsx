import { zodResolver } from '@hookform/resolvers/zod'
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
  TooltipTrigger,
  WorkloadRatingDisplay
} from '@uni-feedback/ui'
import {
  formatSchoolYearString,
  getCurrentSchoolYear
} from '@uni-feedback/utils'
import { Check, ChevronsUpDown, HelpCircle, Loader2, Send } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { useDegreeCourses, useFacultyDegrees } from '~/hooks/queries'
import { cn } from '~/utils/tailwind'

interface GiveFeedbackContentProps {
  faculties: Faculty[]
  initialFormValues?: {
    email: string
    facultyId: number
    degreeId: number
    courseId: number
  }
  onSubmit: (values: FeedbackFormData) => Promise<void>
  onReset?: () => void
  isSubmitting: boolean
  isSuccess: boolean
}

// Create form schema factory that validates email against faculty suffixes
const createFeedbackSchema = (faculties: Faculty[]) =>
  z
    .object({
      email: z.string().email('Invalid email address'),
      schoolYear: z.number().min(2000, 'Invalid school year'),
      facultyId: z.number().min(1, 'Faculty is required'),
      degreeId: z.number().min(1, 'Degree is required'),
      courseId: z.number().min(1, 'Course is required'),
      rating: z.number().min(1, 'Rating is required').max(5),
      workloadRating: z.number().min(1, 'Workload rating is required').max(5),
      comment: z.string().optional()
    })
    .superRefine((data, ctx) => {
      // Find the selected faculty
      const selectedFaculty = faculties.find((f) => f.id === data.facultyId)

      // If faculty has email suffix restrictions, validate the email
      if (
        selectedFaculty?.emailSuffixes &&
        selectedFaculty.emailSuffixes.length > 0
      ) {
        const emailDomain = data.email.split('@')[1]?.toLowerCase()
        const isValidDomain = selectedFaculty.emailSuffixes.some(
          (suffix) => emailDomain === suffix.toLowerCase()
        )

        if (!isValidDomain) {
          const suffixesWithAt = selectedFaculty.emailSuffixes.map(
            (suffix) => `@${suffix}`
          )
          const errorMessage =
            suffixesWithAt.length === 1
              ? `Email must end with ${suffixesWithAt[0]}`
              : `Email must end with one of: ${suffixesWithAt.join(', ')}`

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: errorMessage,
            path: ['email']
          })
        }
      }
    })

type FeedbackFormData = z.infer<ReturnType<typeof createFeedbackSchema>>

export function GiveFeedbackContent({
  faculties,
  initialFormValues,
  onSubmit,
  onReset,
  isSubmitting,
  isSuccess
}: GiveFeedbackContentProps) {
  const feedbackSchema = useMemo(
    () => createFeedbackSchema(faculties),
    [faculties]
  )

  const form = useForm({
    resolver: zodResolver(feedbackSchema),
    mode: 'onChange', // Validate on change to enable/disable submit button
    defaultValues: {
      email: initialFormValues?.email || '',
      schoolYear: getCurrentSchoolYear(),
      facultyId: initialFormValues?.facultyId || 0,
      degreeId: initialFormValues?.degreeId || 0,
      courseId: initialFormValues?.courseId || 0,
      rating: 0,
      workloadRating: 0,
      comment: ''
    }
  })

  // Watch only the fields needed for conditional rendering and data fetching
  const selectedFacultyId = form.watch('facultyId')
  const selectedDegreeId = form.watch('degreeId')

  // Fetch degrees and courses based on selections
  const { data: degrees = [], isLoading: isLoadingDegrees } = useFacultyDegrees(
    selectedFacultyId > 0 ? selectedFacultyId : null
  )

  const { data: courses = [], isLoading: isLoadingCourses } = useDegreeCourses(
    selectedDegreeId > 0 ? selectedDegreeId : null
  )

  // Find selected faculty for email placeholder
  const selectedFaculty = useMemo(
    () => faculties.find((f) => f.id === selectedFacultyId) || null,
    [faculties, selectedFacultyId]
  )

  // Generate school years
  const schoolYears = useMemo(
    () => Array.from({ length: 5 }, (_, i) => getCurrentSchoolYear() - i),
    []
  )

  // Re-validate email when faculty changes (to check email suffix restrictions)
  useEffect(() => {
    const email = form.getValues('email')
    if (email && selectedFacultyId > 0) {
      form.trigger('email')
    }
  }, [selectedFacultyId, form])

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
  const showDegreeField = selectedFacultyId > 0
  const showCourseField =
    selectedDegreeId > 0 && degrees?.some((d) => d.id === selectedDegreeId)

  // Handle reset
  const handleReset = () => {
    form.reset()
    onReset?.()
  }

  // Show success state
  if (isSuccess) {
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
            Feedback Received!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for sharing your course experience. Your feedback helps
            fellow students make informed decisions.
          </p>
          <div className="space-y-3">
            <Button onClick={handleReset} className="w-full">
              Submit Another Review
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <div className="flex items-center gap-2">
                      <span>
                        Email
                        {!field.value && (
                          <span className="text-red-500">*</span>
                        )}
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              tabIndex={0}
                              aria-label="Email info"
                            >
                              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-xs text-sm"
                          >
                            We ask for your email to verify you are a university
                            student. We may contact you about your feedback if
                            needed.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={emailPlaceholder}
                      {...field}
                      className="bg-white"
                    />
                  </FormControl>
                  <FormDescription>
                    We'll never share your email with anyone.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* School Year */}
            <div className="flex flex-wrap gap-2">
              <FormField
                name="schoolYear"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Year</FormLabel>
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

            {/* Faculty, Degree, Course */}
            <div className="flex flex-wrap gap-2">
              <div className="flex flex-wrap gap-2 justify-start">
                {/* Faculty */}
                <FormField
                  name="facultyId"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        University
                        {!selectedFacultyId && (
                          <span className="text-red-500">*</span>
                        )}
                      </FormLabel>
                      <Popover>
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
                        <Popover>
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
                        <Popover>
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

            {/* Comment */}
            <div className="space-y-6">
              <FormField
                name="comment"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Write your feedback</FormLabel>
                    <FormControl>
                      <MarkdownTextarea
                        placeholder="What should others know about this course?"
                        previewPlaceholder="This is how your feedback will appear on the website"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-500 pl-2">
                      ❤️ This field is optional, but it's the one that helps
                      other students the most!
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full mt-6 mb-0">
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
            </Button>

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
