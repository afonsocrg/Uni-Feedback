import {
  MarkdownTextarea,
  StarRatingWithLabel,
  WarningAlert
} from '@components'
import { useIsMobile } from '@hooks'
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
import { getCoursePath } from '@utils/routes'
import { motion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  Loader2,
  Send
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { GiveReviewProps } from './types'

export function GiveReviewForm5({
  form,
  courses,
  schoolYears,
  isSubmitting,
  contextDegree,
  onSubmit
}: GiveReviewProps) {
  const navigate = useNavigate()
  const selectedCourseId = form.watch('courseId')
  const selectedCourse = courses.find((c) => c.id === selectedCourseId)
  const isMobile = useIsMobile()

  const selectClassNames =
    'font-bold underline flex items-center gap-1 px-0 bg-transparent border-none shadow-none focus:outline-none w-auto'

  const courseSelectClassNames =
    'font-bold underline flex items-center gap-1 px-0 bg-transparent border-none shadow-none focus:outline-none max-w-[300px]'

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <>
                        <span>Email</span>
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
                              We ask for your email in case we need to get back
                              to you regarding your review.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your.email@example.com"
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
              <div className="flex flex-wrap items-center gap-x-2 gap-y-4 font-normal text-sm">
                {/* School Year Selector */}
                <FormField
                  control={form.control}
                  name="schoolYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        {isMobile ? (
                          <select
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            className={selectClassNames}
                          >
                            {schoolYears.map((year) => (
                              <option key={year} value={year}>
                                {formatSchoolYearString(year, {
                                  yearFormat: 'long'
                                })}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Select
                            onValueChange={(val) => field.onChange(Number(val))}
                            defaultValue={field.value?.toString()}
                          >
                            <SelectTrigger className={selectClassNames}>
                              <SelectValue placeholder="Select year" />
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
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Course Selector */}
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        {isMobile ? (
                          <>
                            <select
                              value={field.value}
                              onChange={(e) => {
                                field.onChange(Number(e.target.value))
                              }}
                              className={courseSelectClassNames}
                            >
                              <option value="0">Select course...</option>
                              {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </>
                        ) : (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className={courseSelectClassNames}
                              >
                                <span className="truncate">
                                  {courses.find((c) => c.id === field.value)
                                    ?.name || 'Select course'}
                                </span>
                                <ChevronDown className="w-5 h-5 opacity-70 flex-shrink-0" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
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
                                        value={`${c.name}`}
                                        key={c.id}
                                        onSelect={() => field.onChange(c.id)}
                                      >
                                        <span className="truncate">
                                          {c.name}
                                        </span>
                                        <Check
                                          className={cn(
                                            'ml-auto flex-shrink-0',
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
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedCourse && (
                  <Link to={getCoursePath(selectedCourse)} target="_blank">
                    <ExternalLink className="size-3 text-primaryBlue hover:text-primaryBlue/80" />
                  </Link>
                )}
              </div>
              {localDegree?.id !== contextDegree?.id && (
                <WarningAlert
                  message={
                    <>
                      {`You are submitting a review for a ${localDegree?.acronym} course, but you currently selected ${contextDegree?.acronym}. `}
                      <button
                        className="underline cursor-pointer"
                        onClick={() => {
                          navigate('/')
                        }}
                      >
                        Browse {contextDegree?.acronym} courses
                      </button>
                    </>
                  }
                />
              )}
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Rating</FormLabel>
                    <FormControl>
                      <StarRatingWithLabel
                        value={field.value}
                        onChange={field.onChange}
                        size="lg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workloadRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workload Rating</FormLabel>
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="comment"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tell us more about your experience...</FormLabel>
                    <FormControl>
                      <MarkdownTextarea
                        placeholder="Share your experience with this course..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                      You can use Markdown to format your comment!!{' '}
                      <Link
                        to="https://www.markdownguide.org/basic-syntax/"
                        target="_blank"
                        className="underline text-primaryBlue hover:text-primaryBlue/80"
                      >
                        Learn more
                      </Link>
                    </FormDescription>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
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
  )
}
