import { MarkdownTextarea, StarRatingWithLabel } from '@components'
import { useDegrees } from '@hooks'
import { formatSchoolYearString } from '@lib/schoolYear'
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
  HelpCircle,
  Lightbulb,
  Loader2,
  Mic,
  Send
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { z } from 'zod'
import { FeedbackTipsDialog } from './FeedbackTipsDialog'
import { GiveReviewProps } from './types'
import { VoiceFeedbackDialog } from './VoiceFeedbackDialog'

// Utility function to check if a field is required in the Zod schema
function isFieldRequired(schema: z.ZodSchema, fieldName: string): boolean {
  try {
    const shape = (schema as any)._def?.shape()
    const field = shape?.[fieldName]

    if (!field) return false

    // Check if field is optional
    return !field.isOptional()
  } catch {
    return false
  }
}

// Function to get required fields from schema
function getRequiredFields(schema: z.ZodSchema): string[] {
  try {
    const shape = (schema as any)._def?.shape()
    if (!shape) return []

    return Object.keys(shape).filter((fieldName) => {
      const field = shape[fieldName]
      return !field.isOptional()
    })
  } catch {
    return []
  }
}

export function GiveReviewForm7({
  form,
  courses,
  schoolYears,
  isSubmitting,
  onSubmit,
  schema
}: GiveReviewProps) {
  const { data: degrees } = useDegrees()

  const selectedDegreeId = form.watch('degreeId')
  const [isFeedbackTipsDialogOpen, setIsFeedbackTipsDialogOpen] =
    useState(false)
  const [isVoiceFeedbackDialogOpen, setIsVoiceFeedbackDialogOpen] =
    useState(false)

  // Watch all form values to check for completeness
  const formValues = form.watch()

  // Get required fields from schema
  const requiredFields = useMemo(() => {
    if (!schema) return []
    return getRequiredFields(schema)
  }, [schema])

  // Check if field is required
  const isRequired = useMemo(() => {
    if (!schema) return {}
    return requiredFields.reduce(
      (acc, field) => {
        acc[field] = isFieldRequired(schema, field)
        return acc
      },
      {} as Record<string, boolean>
    )
  }, [schema, requiredFields])

  // Check if all required fields are filled
  const isFormValid = useMemo(() => {
    if (!schema || requiredFields.length === 0) return true

    return requiredFields.every((field) => {
      const value = formValues[field as keyof typeof formValues]

      // Special handling for different field types
      if (field === 'email') {
        return typeof value === 'string' && value.trim() !== ''
      }
      if (field === 'degreeId') {
        return typeof value === 'number' && value > 0
      }
      if (field === 'courseId') {
        return (
          typeof value === 'number' &&
          value > 0 &&
          courses.some((c) => c.id === value)
        )
      }
      if (field === 'rating' || field === 'workloadRating') {
        return typeof value === 'number' && value > 0
      }
      if (field === 'schoolYear') {
        return typeof value === 'number' && value > 0
      }

      // Default check for other fields
      return value !== undefined && value !== null && value !== ''
    })
  }, [formValues, requiredFields, schema])

  // Watch individual fields for asterisk display
  const email = form.watch('email')
  const schoolYear = form.watch('schoolYear')
  const courseId = form.watch('courseId')
  const rating = form.watch('rating')
  const workloadRating = form.watch('workloadRating')

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
              <div className="w-full p-3 bg-istBlue/5 border border-istBlue/20 rounded-md flex justify-start items-center gap-3">
                <Mic className="w-6 h-6 sm:w-5 sm:h-5 text-istBlue flex-shrink-0" />
                <div className="text-sm text-wrap text-start">
                  <span className="text-gray-700">
                    You can now submit your feedback by sending us a voice
                    message.{' '}
                  </span>
                  <span
                    className="font-medium text-istBlue underline cursor-pointer"
                    onClick={() => setIsVoiceFeedbackDialogOpen(true)}
                  >
                    Learn more!
                  </span>
                </div>
              </div>
            </div>
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
                            placeholder="your.email@tecnico.ulisboa.pt"
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
                              <SelectTrigger className="w-[180px] bg-white">
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
                          {/* <FormDescription>
                      We'll never share your email with anyone.
                    </FormDescription> */}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-wrap gap-2">
                      <FormField
                        name="degreeId"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="flex flex-col flex-grow">
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
                                      'w-[200px] justify-between',
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
                                    placeholder="Search course..."
                                    className="h-9"
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      No courses found.
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
                      {selectedDegreeId && selectedDegreeId > 0 ? (
                        <FormField
                          name="courseId"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex flex-col flex-grow">
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
                                        'w-[200px] justify-between truncate',
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
                              {isRequired.workloadRating && !workloadRating && (
                                <span className="text-red-500">*</span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <StarRatingWithLabel
                                value={field.value}
                                onChange={field.onChange}
                                size="lg"
                                labels={[
                                  'No work-life balance possible',
                                  'Difficult to balance with other courses',
                                  'Balanced with other commitments',
                                  'Easy to balance with other courses',
                                  'Barely impacted my schedule'
                                ]}
                                labelPosition="bottom"
                              />
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
                          ❤️ This field is optional, but it's the one that helps
                          other students the most!
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={!isFormValid || isSubmitting}
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
              </form>
            </Form>
          </div>
        </motion.div>
      </main>
    </>
  )
}
