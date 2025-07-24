import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Chip
} from '@uni-feedback/ui'
import { getAdminFeedback, getAdminStats, type AdminFeedbackResponse, type AdminStats } from '@uni-feedback/api-client'
import { MessageSquare, CheckCircle, XCircle, Star, Calendar } from 'lucide-react'

export function FeedbackPage() {
  const [feedback, setFeedback] = useState<AdminFeedbackResponse | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const [feedbackData, statsData] = await Promise.all([
          getAdminFeedback({
            page: currentPage,
            limit: 20,
            search: searchTerm || undefined
          }),
          getAdminStats()
        ])
        setFeedback(feedbackData)
        setStats(statsData)
      } catch (error) {
        console.error('Failed to fetch feedback data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentPage, searchTerm])

  const approvedCount = stats ? stats.totalFeedback - stats.recentFeedbackCount : 0
  const pendingCount = stats?.recentFeedbackCount || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
          <p className="text-muted-foreground">
            Review and moderate student feedback
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Chip label={`${pendingCount} Recent`} color="orange" />
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Feedback
            </CardTitle>
            <div className="p-2 bg-blue-500 rounded-full">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.totalFeedback.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              All time submissions
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <div className="p-2 bg-green-500 rounded-full">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {approvedCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Published feedback</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent (7 days)
            </CardTitle>
            <div className="p-2 bg-orange-500 rounded-full">
              <Calendar className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">New submissions</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-r from-cyan-50/50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-500 rounded-lg">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            Feedback Management
          </CardTitle>
          <CardDescription>
            Review and moderate student course feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search feedback by course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-full bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-3/4 bg-muted rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
                      <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : feedback?.feedback.length ? (
              <div className="space-y-3">
                {feedback.feedback.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                      {item.courseName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold truncate">{item.courseName}</h3>
                        <Chip label={item.courseCode} color="cyan" />
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{item.overallRating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.degreeName} • {item.facultyName}
                      </p>
                      {item.comment && (
                        <p className="text-sm text-foreground bg-muted/50 p-2 rounded mb-2 line-clamp-2">
                          "{item.comment}"
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Workload: {item.workloadRating}/5</span>
                        <span>School Year: {item.schoolYear}</span>
                        <span>Submitted: {new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View Course
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No feedback found</p>
              </div>
            )}

            {feedback && feedback.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {feedback.feedback.length} of {feedback.total} feedback entries
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {feedback.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(feedback.totalPages, p + 1))}
                    disabled={currentPage === feedback.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
