import { PaginationControls } from '@components'
import { useQuery } from '@tanstack/react-query'
import { getAdminFeedbackNew } from '@uni-feedback/api-client'
import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StarRating,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WorkloadRatingDisplay
} from '@uni-feedback/ui'
import { Check, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { markdownToText } from '../../utils/markdownToText'

interface FeedbackTabContentProps {
  courseId: number
}

export function FeedbackTabContent({ courseId }: FeedbackTabContentProps) {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [approvedFilter, setApprovedFilter] = useState<string>('all')
  const [limit, setLimit] = useState(10)


  const feedbackQuery = useMemo(() => {
    const query: {
      page: number
      limit: number
      course_id: number
      approved?: boolean
    } = {
      page,
      limit,
      course_id: courseId
    }

    if (approvedFilter !== 'all') {
      query.approved = approvedFilter === 'approved'
    }

    return query
  }, [page, limit, courseId, approvedFilter])

  const {
    data: feedbackData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['course-feedback', feedbackQuery],
    queryFn: () => getAdminFeedbackNew(feedbackQuery)
  })

  const handleApprovedFilterChange = (value: string) => {
    setApprovedFilter(value)
    setPage(1) // Reset to first page when filtering
  }

  const handleFeedbackClick = (feedbackId: number) => {
    navigate(`/feedback/${feedbackId}`)
  }


  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load feedback</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 justify-end">
        <Select
          value={approvedFilter}
          onValueChange={handleApprovedFilterChange}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback Table */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading feedback...</p>
        </div>
      ) : !feedbackData?.data.length ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No feedback found</p>
          {approvedFilter !== 'all' && (
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your filter
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Approved</TableHead>
                  <TableHead className="w-32">School Year</TableHead>
                  <TableHead className="w-48">Ratings</TableHead>
                  <TableHead className="w-auto">Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbackData.data.map((feedback) => (
                  <TableRow 
                    key={feedback.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleFeedbackClick(feedback.id)}
                  >
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {feedback.approved ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {feedback.schoolYear ? (
                        <Badge variant="outline" className="text-xs">
                          {feedback.schoolYear}/{feedback.schoolYear + 1}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <StarRating value={feedback.rating} size="sm" />
                          <span className="text-sm text-muted-foreground">
                            {feedback.rating}/5
                          </span>
                        </div>
                        {feedback.workloadRating ? (
                          <WorkloadRatingDisplay rating={feedback.workloadRating} />
                        ) : (
                          <span className="text-xs text-muted-foreground">No workload rating</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {feedback.comment ? (
                        <p className="text-sm line-clamp-4" title={markdownToText(feedback.comment)}>
                          {markdownToText(feedback.comment)}
                        </p>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          No comment
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            currentPage={page}
            totalPages={feedbackData.totalPages}
            pageSize={limit}
            total={feedbackData.total}
            onPageChange={setPage}
            onPageSizeChange={(newLimit) => {
              setLimit(newLimit)
              setPage(1)
            }}
          />
        </>
      )}
    </div>
  )
}
