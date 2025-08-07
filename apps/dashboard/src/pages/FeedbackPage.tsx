import { PaginationControls } from '@components'
import { useQuery } from '@tanstack/react-query'
import { useAdminFilters } from '@hooks'
import {
  getAdminCoursesNew,
  getAdminFeedbackNew,
  getDegreeSuggestions,
  getFaculties,
  type AdminFeedbackQuery
} from '@uni-feedback/api-client'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chip,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  StarRatingWithLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WorkloadRatingDisplay
} from '@uni-feedback/ui'
import { Check, ChevronsUpDown, MessageSquare, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { markdownToText } from '../utils/markdownToText'

export function FeedbackPage() {
  const navigate = useNavigate()

  // Local state for pagination and filters
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const { facultyId, degreeId, courseId, setFaculty, setDegree, setCourse } = useAdminFilters()
  const [approvedFilter, setApprovedFilter] = useState('all')

  const selectedFacultyId = facultyId?.toString() ?? 'all'
  const selectedDegreeId = degreeId?.toString() ?? 'all'
  const selectedCourseId = courseId?.toString() ?? 'all'
  const [degreePopoverOpen, setDegreePopoverOpen] = useState(false)
  const [coursePopoverOpen, setCoursePopoverOpen] = useState(false)

  // Build query object using debounced search and current filters
  const query: AdminFeedbackQuery = {
    page,
    limit,
    ...(facultyId !== null && {
      faculty_id: facultyId
    }),
    ...(degreeId !== null && {
      degree_id: degreeId
    }),
    ...(courseId !== null && {
      course_id: courseId
    }),
    ...(approvedFilter !== 'all' && { approved: approvedFilter === 'approved' })
  }

  // Fetch data
  const {
    data: feedbackResponse,
    isLoading: feedbackLoading,
    error: feedbackError,
    refetch: refetchFeedback
  } = useQuery({
    queryKey: ['admin-feedback', query],
    queryFn: () => getAdminFeedbackNew(query)
  })

  const { data: faculties = [] } = useQuery({
    queryKey: ['faculties'],
    queryFn: getFaculties
  })

  const { data: degrees = [] } = useQuery({
    queryKey: [
      'degree-suggestions',
      facultyId
    ],
    queryFn: () =>
      getDegreeSuggestions(
        facultyId ?? undefined
      ),
    enabled: facultyId !== null
  })

  const { data: coursesResponse } = useQuery({
    queryKey: [
      'admin-courses',
      degreeId
    ],
    queryFn: () =>
      getAdminCoursesNew({
        degree_id: degreeId ?? undefined,
        limit: 1000 // Get all courses for the degree
      }),
    enabled: degreeId !== null
  })

  const feedback = feedbackResponse?.data || []
  const courses = coursesResponse?.data || []

  // Handle faculty change
  const handleFacultyChange = (newFacultyId: string) => {
    setFaculty(newFacultyId === 'all' ? null : parseInt(newFacultyId, 10))
    setPage(1)
  }

  // Handle degree change
  const handleDegreeChange = (newDegreeId: string) => {
    setDegree(newDegreeId === 'all' ? null : parseInt(newDegreeId, 10))
    setPage(1)
  }

  // Handle course change
  const handleCourseChange = (newCourseId: string) => {
    setCourse(newCourseId === 'all' ? null : parseInt(newCourseId, 10))
    setPage(1)
  }

  // Handle approved filter change
  const handleApprovedFilterChange = (newApproved: string) => {
    setApprovedFilter(newApproved)
    setPage(1)
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newLimit: number) => {
    setPage(1)
    setLimit(newLimit)
  }

  // Handle row clicks
  const handleFeedbackClick = (feedbackId: number) => {
    navigate(`/feedback/${feedbackId}`)
  }

  const handleFacultyClick = (e: React.MouseEvent, facultyId: number) => {
    e.stopPropagation()
    navigate(`/faculties/${facultyId}`)
  }

  const handleDegreeClick = (e: React.MouseEvent, degreeId: number) => {
    e.stopPropagation()
    navigate(`/degrees/${degreeId}`)
  }

  const handleCourseClick = (e: React.MouseEvent, courseId: number) => {
    e.stopPropagation()
    navigate(`/courses/${courseId}`)
  }

  const hasFilters =
    facultyId !== null ||
    degreeId !== null ||
    courseId !== null ||
    approvedFilter !== 'all'

  if (feedbackError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Failed to load feedback
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {feedbackError instanceof Error
              ? feedbackError.message
              : 'An error occurred'}
          </p>
          <Button onClick={() => refetchFeedback()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Feedback Management</h1>
          <Badge variant="secondary" className="ml-2">
            {feedbackResponse?.total || 0} feedback entries
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select
              value={selectedFacultyId}
              onValueChange={handleFacultyChange}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All faculties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All faculties</SelectItem>
                {faculties.map((faculty) => (
                  <SelectItem key={faculty.id} value={faculty.id.toString()}>
                    <Chip label={faculty.shortName} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover
              open={degreePopoverOpen}
              onOpenChange={setDegreePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={degreePopoverOpen}
                  className="w-full sm:w-48 justify-between font-normal"
                  disabled={facultyId === null}
                >
                  {selectedDegreeId === 'all'
                    ? facultyId === null
                      ? 'Select faculty first'
                      : 'All degrees'
                    : (degrees.find((d) => d.id.toString() === selectedDegreeId)
                        ?.acronym ?? 'Select degree')}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search degrees..."
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No degrees found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          handleDegreeChange('all')
                          setDegreePopoverOpen(false)
                        }}
                      >
                        All degrees
                        <Check
                          className={cn(
                            'ml-auto',
                            selectedDegreeId === 'all'
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                      {degrees.map((degree) => (
                        <CommandItem
                          value={`${degree.acronym} - ${degree.name}`}
                          key={degree.id}
                          onSelect={() => {
                            handleDegreeChange(degree.id.toString())
                            setDegreePopoverOpen(false)
                          }}
                        >
                          {degree.acronym} - {degree.name}
                          <Check
                            className={cn(
                              'ml-auto',
                              degree.id.toString() === selectedDegreeId
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

            <Popover
              open={coursePopoverOpen}
              onOpenChange={setCoursePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={coursePopoverOpen}
                  className="w-full sm:w-48 justify-between font-normal"
                  disabled={degreeId === null}
                >
                  {selectedCourseId === 'all'
                    ? degreeId === null
                      ? 'Select degree first'
                      : 'All courses'
                    : (courses.find((c) => c.id.toString() === selectedCourseId)
                        ?.acronym ?? 'Select course')}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search courses..."
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No courses found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          handleCourseChange('all')
                          setCoursePopoverOpen(false)
                        }}
                      >
                        All courses
                        <Check
                          className={cn(
                            'ml-auto',
                            selectedCourseId === 'all'
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                      {courses.map((course) => (
                        <CommandItem
                          value={`${course.acronym} - ${course.name}`}
                          key={course.id}
                          onSelect={() => {
                            handleCourseChange(course.id.toString())
                            setCoursePopoverOpen(false)
                          }}
                        >
                          {course.acronym} - {course.name}
                          <Check
                            className={cn(
                              'ml-auto',
                              course.id.toString() === selectedCourseId
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

            <Select
              value={approvedFilter}
              onValueChange={handleApprovedFilterChange}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Not Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {feedbackLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : feedback.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">
                {hasFilters ? 'No feedback found' : 'No feedback yet'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {hasFilters
                  ? 'Try adjusting your search terms or filters'
                  : 'No feedback has been submitted yet'}
              </p>
            </div>
          ) : (
            /* Feedback Table */
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Faculty</TableHead>
                      <TableHead>Degree</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>School Year</TableHead>
                      <TableHead>Ratings</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead className="text-center">Approved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.map((feedbackItem) => (
                      <TableRow
                        key={feedbackItem.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleFeedbackClick(feedbackItem.id)}
                      >
                        <TableCell>
                          <Chip
                            label={feedbackItem.facultyShortName}
                            onClick={(e) =>
                              handleFacultyClick(e, feedbackItem.facultyId)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={feedbackItem.degreeAcronym}
                            onClick={(e) =>
                              handleDegreeClick(e, feedbackItem.degreeId)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={feedbackItem.courseAcronym}
                            onClick={(e) =>
                              handleCourseClick(e, feedbackItem.courseId)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {feedbackItem.schoolYear ? (
                            <Chip
                              label={`${feedbackItem.schoolYear}/${feedbackItem.schoolYear + 1}`}
                            />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <StarRatingWithLabel
                              value={feedbackItem.rating}
                              size="sm"
                            />
                            {feedbackItem.workloadRating ? (
                              <WorkloadRatingDisplay
                                rating={feedbackItem.workloadRating}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No workload rating
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {feedbackItem.comment ? (
                            <p
                              className="text-sm line-clamp-4"
                              title={markdownToText(feedbackItem.comment)}
                            >
                              {markdownToText(feedbackItem.comment)}
                            </p>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No comment
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            {feedbackItem.approved ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {feedbackResponse && (
                <PaginationControls
                  currentPage={feedbackResponse.page}
                  totalPages={feedbackResponse.totalPages}
                  pageSize={feedbackResponse.limit}
                  total={feedbackResponse.total}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
