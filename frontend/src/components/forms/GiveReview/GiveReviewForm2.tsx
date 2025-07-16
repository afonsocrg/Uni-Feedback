import { MarkdownTextarea, StarRatingWithLabel } from '@components'
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
import { Check, ChevronDown, HelpCircle, Loader2, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GiveReviewProps } from './types'

export function GiveReviewForm2({
  form,
  courses,
  schoolYears,
  isSubmitting,
  onSubmit
}: GiveReviewProps) {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          {/* <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Leave your Review
          </h1>
          <Markdown>
            Thank you for taking the time to leave your review on a MEIC course!
            To ensure we have quality reviews on the website, we review every
            comment, one by one, before posting them.
          </Markdown> */}
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
              <div className="flex items-center gap-2 font-normal text-sm">
                <span>Your feedback for:</span>

                {/* Course Selector */}
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="font-bold underline flex items-center gap-1 px-0 bg-transparent border-none shadow-none focus:outline-none"
                            >
                              {courses.find((c) => c.id === field.value)
                                ?.acronym || 'Select course'}
                              <ChevronDown className="w-5 h-5 opacity-70" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[250px] p-0">
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
                                      value={`${c.acronym}`}
                                      key={c.id}
                                      onSelect={() => field.onChange(c.id)}
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* School Year Selector */}
                <FormField
                  control={form.control}
                  name="schoolYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          onValueChange={(val) => field.onChange(Number(val))}
                          defaultValue={field.value?.toString()}
                        >
                          <SelectTrigger className="font-bold underline flex items-center gap-1 px-0 bg-transparent border-none shadow-none focus:outline-none w-auto">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>School Years</SelectLabel>
                              {schoolYears.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
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
