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
import { getAdminDegrees, type AdminDegreesResponse } from '@uni-feedback/api-client'
import { GraduationCap, Plus, BookOpen, MessageSquare } from 'lucide-react'

export function DegreesPage() {
  const [degrees, setDegrees] = useState<AdminDegreesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchDegrees() {
      try {
        setIsLoading(true)
        const data = await getAdminDegrees({
          page: currentPage,
          limit: 20,
          search: searchTerm || undefined
        })
        setDegrees(data)
      } catch (error) {
        console.error('Failed to fetch degrees:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDegrees()
  }, [currentPage, searchTerm])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Degrees</h1>
          <p className="text-muted-foreground">
            Manage degree programs and their course structure
          </p>
        </div>
        <Button className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600">
          <Plus className="h-4 w-4" />
          Add Degree
        </Button>
      </div>

      <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500 rounded-lg">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            Degree Management
          </CardTitle>
          <CardDescription>View and manage degree programs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search degrees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="h-12 w-12 bg-muted rounded-lg animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-64 bg-muted rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
                      <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : degrees?.degrees.length ? (
              <div className="space-y-3">
                {degrees.degrees.map((degree) => (
                  <div key={degree.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-semibold">
                      {degree.code.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold">{degree.name}</h3>
                        <Chip label={degree.type} color="purple" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {degree.facultyName}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{degree.courseCount} courses</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{degree.feedbackCount} reviews</span>
                        </div>
                        <span>Created: {new Date(degree.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View Courses
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No degrees found</p>
              </div>
            )}

            {degrees && degrees.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {degrees.degrees.length} of {degrees.total} degrees
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
                    Page {currentPage} of {degrees.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(degrees.totalPages, p + 1))}
                    disabled={currentPage === degrees.totalPages}
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
