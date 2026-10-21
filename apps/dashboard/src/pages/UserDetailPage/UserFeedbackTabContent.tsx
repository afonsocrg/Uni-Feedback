import { PaginationControls } from '@components'
import { useQuery } from '@tanstack/react-query'
import {
  getAdminFeedbackNew,
  type AdminFeedbackQuery
} from '@uni-feedback/api-client'
import {
  Badge,
  Chip,
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
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { markdownToText } from '../../utils/markdownToText'

interface UserFeedbackTabContentProps {
  userId: number
}

export function UserFeedbackTabContent({
  userId
}: UserFeedbackTabContentProps) {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [approvedFilter, setApprovedFilter] = useState<string>('all')

  const query: AdminFeedbackQuery = {
    page,
    limit,
    user_id: userId,
    ...(approvedFilter !== 'all' && {
      approved: approvedFilter === 'approved'
    })
  }

  const {
    data: feedbackData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-feedback', query],
    queryFn: () => getAdminFeedbackNew(query)
  })

  const stop = (e: React.MouseEvent) => e.stopPropagation()

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
      <div className="flex gap-4 justify-end">
        <Select
          value={approvedFilter}
          onValueChange={(value) => {
            setApprovedFilter(value)
            setPage(1)
          }}
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

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading feedback...</p>
        </div>
      ) : !feedbackData?.data.length ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {approvedFilter === 'all'
              ? 'This user has not submitted any feedback'
              : 'No feedback found'}
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 text-center">Approved</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="w-32">School Year</TableHead>
                  <TableHead className="w-48">Ratings</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className="w-28">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbackData.data.map((feedback) => (
                  <TableRow
                    key={feedback.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/feedback/${feedback.id}`)}
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
                      <div className="flex gap-1 flex-wrap">
                        <Chip
                          label={feedback.facultyShortName}
                          onClick={(e) => {
                            stop(e)
                            navigate(`/faculties/${feedback.facultyId}`)
                          }}
                        />
                        <Chip
                          label={feedback.degreeAcronym}
                          onClick={(e) => {
                            stop(e)
                            navigate(`/degrees/${feedback.degreeId}`)
                          }}
                        />
                        <Chip
                          label={feedback.courseAcronym}
                          onClick={(e) => {
                            stop(e)
                            navigate(`/courses/${feedback.courseId}`)
                          }}
                        />
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
                        <StarRating value={feedback.rating} size="sm" />
                        {feedback.workloadRating ? (
                          <WorkloadRatingDisplay
                            rating={feedback.workloadRating}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No workload rating
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {feedback.comment ? (
                        <p
                          className="text-sm line-clamp-4"
                          title={markdownToText(feedback.comment)}
                        >
                          {markdownToText(feedback.comment)}
                        </p>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          No comment
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(feedback.createdAt).toLocaleDateString()}
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
