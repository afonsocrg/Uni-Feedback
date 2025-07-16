import { getWorkloadColor, getWorkloadLabel } from '@/lib/workload'
import { Faculty } from '@/services/meicFeedbackAPI'
import { MarkdownTextarea, StarRatingWithLabel } from '@components'
import { useFaculties, useFacultyDegrees } from '@hooks'
import { formatSchoolYearString } from '@lib/schoolYear'
import { isRequired } from '@pages/GiveReview'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@ui'
import { cn } from '@utils'
import { motion } from 'framer-motion'
import {
  Check,
  ChevronsUpDown,
  Clock,
  HelpCircle,
  Lightbulb,
  Loader2,
  Mic,
  Send
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { FeedbackTipsDialog } from './FeedbackTipsDialog'
import { GiveReviewProps } from './types'
import { VoiceFeedbackDialog } from './VoiceFeedbackDialog'

function getEmailPlaceHolder(selectedFaculty: Faculty | null) {
  switch (selectedFaculty?.short_name) {
    case 'IST':
      return 'your.email@tecnico.ulisboa.pt'
    case 'Nova SBE':
      return 'xxxxx@novasbe.pt'
    case 'FCT':
      return 'your.email@fct.unl.pt'
  }
  return 'your.email@university.com'
}

export function GiveReviewForm7({
  form,
  courses,
  schoolYears,
  isSubmitting,
  onSubmit,
  isLoadingFormData = false
}: GiveReviewProps) {
  const selectedDegreeId = form.watch('degreeId')
  const selectedFacultyId = form.watch('facultyId')

  const { data: degrees } = useFacultyDegrees(selectedFacultyId)
  const { data: faculties } = useFaculties()

  // Find local faculty object
  const localFaculty = useMemo(() => {
    if (!faculties || !selectedFacultyId) return null
    return faculties.find((faculty) => faculty.id === selectedFacultyId) || null
  }, [faculties, selectedFacultyId])

  const [isFeedbackTipsDialogOpen, setIsFeedbackTipsDialogOpen] =
    useState(false)
  const [isVoiceFeedbackDialogOpen, setIsVoiceFeedbackDialogOpen] =
    useState(false)

  // Watch individual fields for asterisk display
  const email = form.watch('email')
  const schoolYear = form.watch('schoolYear')
  const courseId = form.watch('courseId')
  const rating = form.watch('rating')
  const workloadRating = form.watch('workloadRating')

  const showDegreeField = useMemo(() => {
    return selectedFacultyId && selectedFacultyId > 0
  }, [selectedFacultyId])

  const showCourseField = useMemo(() => {
    return (
      selectedDegreeId &&
      selectedDegreeId > 0 &&
      degrees?.some((d) => d.id === selectedDegreeId)
    )
  }, [selectedDegreeId, degrees])

  // Show loading indicator when initial data is being fetched
  const isInitialLoading = isLoadingFormData

  return (
    <>
      <VoiceFeedbackDialog
        isOpen={isVoiceFeedbackDialogOpen}
        onClose={() => setIsVoiceFeedbackDialogOpen(false)}
      />
      <FeedbackTipsDialog
        isOpen={isFeedbackTipsDialogOpen}
        onClose={() => setIsFeedbackTipsDialogOpen(false)}
      />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-6">
              Leave your Feedback!
            </h1>

            {/* Voice Feedback Feature */}
            <div className="mb-6">
              <div className="w-full p-3 bg-primaryBlue/5 border border-primaryBlue/20 rounded-md flex justify-start items-center gap-3">
                <Mic className="w-6 h-6 sm:w-5 sm:h-5 text-primaryBlue flex-shrink-0" />
                <div className="text-sm text-wrap text-start">
                  <span className="text-gray-700">
                    You can now submit your feedback by sending us a voice
                    message.{' '}
                  </span>
                  <span
                    className="font-medium text-primaryBlue underline cursor-pointer"
                    onClick={() => setIsVoiceFeedbackDialogOpen(true)}
                  >
                    Learn more!
                  </span>
                </div>
              </div>
            </div>

            {/* Loading Indicator */}
            {isInitialLoading && (
              <div className="mb-6">
                <div className="w-full p-3 bg-primaryBlue/5 border border-blue-200 rounded-md flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primaryBlue flex-shrink-0" />
                  <span className="text-sm text-primaryBlue">
                    Loading form data...
                  </span>
                </div>
              </div>
            )}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-10"
              >
                <div className="space-y-6">
                  <FormField
                    name="email"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <>
                            <span>Email</span>
                            {isRequired.email && !email && (
                              <span className="text-red-500">*</span>
                            )}
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
                                  We ask for your email to verify you are an IST
                                  student. We may contact you about your
                                  feedback if needed.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={getEmailPlaceHolder(localFaculty)}
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
                  <div className="flex flex-wrap gap-2">
                    <FormField
                      name="schoolYear"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            School Year
                            {isRequired.schoolYear && !schoolYear && (
                              <span className="text-red-500">*</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(val) =>
                                field.onChange(Number(val))
                              }
                              defaultValue={field.value.toString()}
                            >
                              <SelectTrigger className="w-[200px] bg-white">
                                <SelectValue placeholder="Select a school year" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>School Years</SelectLabel>
                                  {schoolYears.map((year) => (
                                    <SelectItem
                                      key={year}
                                      value={year.toString()}
                                    >
                                      {formatSchoolYearString(year, {
                                        yearFormat: 'long'
                                      })}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex flex-wrap gap-2 justify-start">
                      <FormField
                        name="facultyId"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              University
                              {isRequired.facultyId && !selectedFacultyId && (
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
                                    {faculties?.find(
                                      (f) => f.id === field.value
                                    )?.short_name ?? 'Select university'}
                                    <ChevronsUpDown className="opacity-50" />
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
                                    <CommandEmpty>
                                      No universities found.
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {faculties?.map((f) => (
                                        <CommandItem
                                          value={`${f.short_name} - ${f.name}`}
                                          key={f.id}
                                          onSelect={() => {
                                            form.setValue('facultyId', f.id)
                                          }}
                                        >
                                          {f.short_name}
                                          <Check
                                            className={
                                              cn(
                                                'ml-auto',
                                                f.id === field.value
                                                  ? 'opacity-100'
                                                  : 'opacity-0'
                                              ) ?? []
                                            }
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
                      {showDegreeField ? (
                        <FormField
                          name="degreeId"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>
                                Degree
                                {isRequired.degreeId && !selectedDegreeId && (
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
                                      {degrees?.find(
                                        (d) => d.id === field.value
                                      )?.acronym ?? 'Select degree'}
                                      <ChevronsUpDown className="opacity-50" />
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
                                      <CommandEmpty>
                                        No degrees found.
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {degrees?.map((c) => (
                                          <CommandItem
                                            value={`${c.acronym} - ${c.name}`}
                                            key={c.id}
                                            onSelect={() => {
                                              form.setValue('degreeId', c.id)
                                            }}
                                          >
                                            {c.acronym} - {c.name}
                                            <Check
                                              className={
                                                cn(
                                                  'ml-auto',
                                                  c.id === field.value
                                                    ? 'opacity-100'
                                                    : 'opacity-0'
                                                ) ?? []
                                              }
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
                      ) : null}
                      {showCourseField ? (
                        <FormField
                          name="courseId"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>
                                Course
                                {isRequired.courseId &&
                                  selectedDegreeId &&
                                  !courseId && (
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
                                        {courses.find(
                                          (c) => c.id === field.value
                                        )?.name ?? 'Select course'}
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
                                      <CommandEmpty>
                                        No courses found.
                                      </CommandEmpty>
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
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-4">
                      <div className="min-w-[220px]">
                        <FormField
                          control={form.control}
                          name="rating"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Overall Rating
                                {isRequired.rating && !rating && (
                                  <span className="text-red-500">*</span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <StarRatingWithLabel
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
                      <div className="min-w-[220px]">
                        <FormField
                          control={form.control}
                          name="workloadRating"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Workload Rating
                                {isRequired.workloadRating &&
                                  !workloadRating && (
                                    <span className="text-red-500">*</span>
                                  )}
                              </FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(val) =>
                                    field.onChange(Number(val))
                                  }
                                  value={field.value?.toString() || ''}
                                >
                                  <SelectTrigger className="w-full bg-white min-h-[40px]">
                                    <SelectValue placeholder="Select workload rating">
                                      {field.value ? (
                                        <div
                                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getWorkloadColor(
                                            field.value
                                          )}`}
                                        >
                                          <Clock className="w-3 h-3 mr-1.5" />
                                          Workload: ({field.value}/5){' '}
                                          {getWorkloadLabel(field.value)}
                                        </div>
                                      ) : null}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectLabel>Workload Rating</SelectLabel>
                                      {[1, 2, 3, 4, 5].map((rating) => (
                                        <SelectItem
                                          key={rating}
                                          value={rating.toString()}
                                        >
                                          <div
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getWorkloadColor(
                                              rating
                                            )}`}
                                          >
                                            <Clock className="w-3 h-3 mr-1.5" />
                                            Workload: ({rating}/5){' '}
                                            {getWorkloadLabel(rating)}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
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

                  <div className="space-y-6">
                    <FormField
                      name="comment"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="w-full flex justify-between">
                            <span>Write your feedback</span>
                            <Button
                              variant="link"
                              size="xs"
                              onClick={(e) => {
                                e.preventDefault()
                                setIsFeedbackTipsDialogOpen(true)
                              }}
                              className="text-gray-500 hover:text-gray-700 hover:no-underline"
                            >
                              <Lightbulb className="size-4" />
                              Feedback tips
                            </Button>
                          </FormLabel>
                          <FormControl>
                            <MarkdownTextarea
                              placeholder="What should others know about this course?"
                              previewPlaceholder="This is how your feedback will appear on the website"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                          <FormDescription className="text-gray-500 pl-2">
                            ❤️ This field is optional, but it's the one that
                            helps other students the most!
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-6"
                    disabled={isSubmitting || isInitialLoading}
                  >
                    <>
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
                    </>
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </motion.div>
      </main>
    </>
  )
}
