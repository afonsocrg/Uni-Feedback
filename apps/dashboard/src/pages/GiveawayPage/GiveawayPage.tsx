import { DatePicker, PaginationControls, TriboolIcon } from '@components'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAdminFeedbackNew,
  populateFeedbackAnalysis,
  recalculateAllPoints,
  type AdminFeedback
} from '@uni-feedback/api-client'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@uni-feedback/ui'
import { Database, Edit, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AnalysisEditDialog } from './AnalysisEditDialog'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function GiveawayPage() {
  const queryClient = useQueryClient()

  // Mutation for populating analysis records
  const populateMutation = useMutation({
    mutationFn: populateFeedbackAnalysis,
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries({
        queryKey: ['admin-feedback-giveaway']
      })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to populate analysis records')
    }
  })

  // Mutation for recalculating points
  const recalculateMutation = useMutation({
    mutationFn: recalculateAllPoints,
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries({
        queryKey: ['admin-feedback-giveaway']
      })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to recalculate points')
    }
  })

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Filter state
  const [createdAfter, setCreatedAfter] = useState<Date | undefined>(undefined)
  const [approvedFilter, setApprovedFilter] = useState<string>('all')
  const [reviewedFilter, setReviewedFilter] = useState<string>('all')

  // Dialog state
  const [editingFeedback, setEditingFeedback] = useState<AdminFeedback | null>(
    null
  )

  // Fetch feedback with filters
  const { data, isLoading, error } = useQuery({
    queryKey: [
      'admin-feedback-giveaway',
      page,
      pageSize,
      createdAfter?.toISOString(),
      approvedFilter,
      reviewedFilter
    ],
    queryFn: () =>
      getAdminFeedbackNew({
        page,
        limit: pageSize,
        has_comment: true,
        created_after: createdAfter?.toISOString(),
        approved:
          approvedFilter === 'approved'
            ? true
            : approvedFilter === 'unapproved'
              ? false
              : undefined,
        reviewed:
          reviewedFilter === 'reviewed'
            ? true
            : reviewedFilter === 'unreviewed'
              ? false
              : undefined
      })
  })

  // Clear filters
  const handleClearFilters = () => {
    setCreatedAfter(undefined)
    setApprovedFilter('all')
    setReviewedFilter('all')
    setPage(1)
  }

  // Reset to page 1 when filters change
  const handleCreatedAfterChange = (date: Date | undefined) => {
    setCreatedAfter(date)
    setPage(1)
  }

  const handleApprovedFilterChange = (value: string) => {
    setApprovedFilter(value)
    setPage(1)
  }

  const handleReviewedFilterChange = (value: string) => {
    setReviewedFilter(value)
    setPage(1)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  const hasActiveFilters =
    createdAfter !== undefined ||
    approvedFilter !== 'all' ||
    reviewedFilter !== 'all'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Giveaway Management</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => populateMutation.mutate()}
                disabled={populateMutation.isPending}
              >
                <Database className="h-4 w-4 mr-2" />
                {populateMutation.isPending
                  ? 'Populating...'
                  : 'Populate Missing Analysis'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => recalculateMutation.mutate()}
                disabled={recalculateMutation.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {recalculateMutation.isPending
                  ? 'Recalculating...'
                  : 'Recalculate Points'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                Review Status
              </label>
              <Select
                value={reviewedFilter}
                onValueChange={handleReviewedFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="unreviewed">Unreviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                Created After
              </label>
              <DatePicker
                selected={createdAfter}
                onSelect={handleCreatedAfterChange}
                placeholder="Select date"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                Approval Status
              </label>
              <Select
                value={approvedFilter}
                onValueChange={handleApprovedFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="unapproved">Unapproved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[300px]">Comment</TableHead>
                  <TableHead className="text-center">Approved</TableHead>
                  <TableHead className="text-center">Teaching</TableHead>
                  <TableHead className="text-center">Assessment</TableHead>
                  <TableHead className="text-center">Materials</TableHead>
                  <TableHead className="text-center">Tips</TableHead>
                  {/* <TableHead className="text-center">Word Count</TableHead> */}
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="min-w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-red-600">
                      Failed to load feedback
                    </TableCell>
                  </TableRow>
                ) : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground"
                    >
                      No feedback found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data.map((feedback: AdminFeedback) => {
                    const needsReview =
                      feedback.analysis === null ||
                      feedback.analysis.reviewedAt === null

                    return (
                      <TableRow
                        key={feedback.id}
                        className={
                          needsReview
                            ? 'bg-amber-50/50 hover:bg-amber-100/50'
                            : undefined
                        }
                      >
                        <TableCell className="whitespace-pre-wrap">
                          {feedback.comment || '--'}
                          {feedback.comment && feedback.analysis?.wordCount && (
                            <span className="ml-2 text-xs text-muted-foreground mt-1">
                              ({feedback.analysis.wordCount} words)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <TriboolIcon value={feedback.approved} />
                        </TableCell>
                        <TableCell className="text-center">
                          <TriboolIcon value={feedback.analysis?.hasTeaching} />
                        </TableCell>
                        <TableCell className="text-center">
                          <TriboolIcon
                            value={feedback.analysis?.hasAssessment}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <TriboolIcon
                            value={feedback.analysis?.hasMaterials}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <TriboolIcon value={feedback.analysis?.hasTips} />
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-semibold">
                              {feedback.points !== null ? (
                                feedback.points
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  --
                                </span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingFeedback(feedback)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {needsReview && (
                              <span
                                className="inline-flex h-2 w-2 rounded-full bg-amber-500"
                                title="Needs review"
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && (
            <PaginationControls
              currentPage={page}
              totalPages={data.totalPages}
              pageSize={pageSize}
              total={data.total}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Analysis Dialog */}
      {editingFeedback && (
        <AnalysisEditDialog
          feedback={editingFeedback}
          open={editingFeedback !== null}
          onOpenChange={(open) => !open && setEditingFeedback(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ['admin-feedback-giveaway']
            })
            setEditingFeedback(null)
          }}
        />
      )}
    </div>
  )
}
