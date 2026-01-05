import { ConfirmationDialog, DatePicker, PaginationControls } from '@components'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveFeedback,
  getAdminFeedbackNew,
  unapproveFeedback,
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
import { Check, Edit, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AnalysisEditDialog } from './AnalysisEditDialog'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function GiveawayPage() {
  const queryClient = useQueryClient()

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Filter state
  const [createdAfter, setCreatedAfter] = useState<Date | undefined>(undefined)
  const [approvedFilter, setApprovedFilter] = useState<string>('all')

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
      approvedFilter
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
              : undefined
      })
  })

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (feedbackId: number) => approveFeedback(feedbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback-giveaway'] })
      toast.success('Feedback approved successfully')
    },
    onError: () => {
      toast.error('Failed to approve feedback')
    }
  })

  // Unapprove mutation
  const unapproveMutation = useMutation({
    mutationFn: (feedbackId: number) => unapproveFeedback(feedbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback-giveaway'] })
      toast.success('Feedback unapproved successfully')
    },
    onError: () => {
      toast.error('Failed to unapprove feedback')
    }
  })

  // Clear filters
  const handleClearFilters = () => {
    setCreatedAfter(undefined)
    setApprovedFilter('all')
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

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  const hasActiveFilters =
    createdAfter !== undefined || approvedFilter !== 'all'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Giveaway Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-4">
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
                  <TableHead className="text-center">Approved</TableHead>
                  <TableHead className="min-w-[300px]">Comment</TableHead>
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
                  data?.data.map((feedback: AdminFeedback) => (
                    <TableRow
                      key={feedback.id}
                      className={
                        feedback.analysis === null ? 'bg-muted/20' : undefined
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {feedback.approved ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600 inline" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-pre-wrap">
                        {feedback.comment || '--'}
                        {feedback.comment && feedback.analysis?.wordCount && (
                          <span className="ml-2 text-xs text-muted-foreground mt-1">
                            ({feedback.analysis.wordCount} words)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {feedback.analysis ? (
                          feedback.analysis.hasTeaching ? (
                            <Check className="h-4 w-4 text-green-600 inline" />
                          ) : (
                            <X className="h-4 w-4 text-red-600 inline" />
                          )
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            --
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {feedback.analysis ? (
                          feedback.analysis.hasAssessment ? (
                            <Check className="h-4 w-4 text-green-600 inline" />
                          ) : (
                            <X className="h-4 w-4 text-red-600 inline" />
                          )
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            --
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {feedback.analysis ? (
                          feedback.analysis.hasMaterials ? (
                            <Check className="h-4 w-4 text-green-600 inline" />
                          ) : (
                            <X className="h-4 w-4 text-red-600 inline" />
                          )
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            --
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {feedback.analysis ? (
                          feedback.analysis.hasTips ? (
                            <Check className="h-4 w-4 text-green-600 inline" />
                          ) : (
                            <X className="h-4 w-4 text-red-600 inline" />
                          )
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            --
                          </span>
                        )}
                      </TableCell>
                      {/* <TableCell className="text-center">
                        {feedback.analysis?.wordCount ?? (
                          <span className="text-muted-foreground text-sm">
                            --
                          </span>
                        )}
                      </TableCell> */}
                      <TableCell className="text-center font-semibold">
                        {feedback.points !== null ? (
                          feedback.points
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            --
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {feedback.approved ? (
                            <ConfirmationDialog
                              title="Unapprove Feedback"
                              message="Are you sure you want to unapprove this feedback?"
                              confirmText="Unapprove"
                              variant="destructive"
                              onConfirm={() =>
                                unapproveMutation.mutate(feedback.id)
                              }
                            >
                              {({ open }) => (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={open}
                                  disabled={unapproveMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </ConfirmationDialog>
                          ) : (
                            <ConfirmationDialog
                              title="Approve Feedback"
                              message="Are you sure you want to approve this feedback?"
                              confirmText="Approve"
                              onConfirm={() =>
                                approveMutation.mutate(feedback.id)
                              }
                            >
                              {({ open }) => (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={open}
                                  disabled={approveMutation.isPending}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                            </ConfirmationDialog>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingFeedback(feedback)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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
