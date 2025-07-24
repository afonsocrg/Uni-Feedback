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
import { getAdminCourses, type AdminCoursesResponse } from '@uni-feedback/api-client'
import { BookOpen, Plus, Star } from 'lucide-react'

export function CoursesPage() {
  const [courses, setCourses] = useState<AdminCoursesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchCourses() {
      try {
        setIsLoading(true)
        const data = await getAdminCourses({
          page: currentPage,
          limit: 20,
          search: searchTerm || undefined
        })
        setCourses(data)
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [currentPage, searchTerm])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">
            Manage courses and their relationships
          </p>
        </div>
        <Button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500 rounded-lg">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            Course Management
          </CardTitle>
          <CardDescription>
            View and manage courses across all degrees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search courses..."
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
            ) : courses?.courses.length ? (
              <div className="space-y-3">
                {courses.courses.map((course) => (
                  <div key={course.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-semibold">
                      {course.code.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold">{course.name}</h3>
                        <Chip label={course.code} color="orange" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {course.degreeName} • {course.facultyName}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>{course.credits} ECTS</span>
                        <span>{course.feedbackCount} reviews</span>
                        {course.averageRating && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{course.averageRating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View Feedback
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No courses found</p>
              </div>
            )}

            {courses && courses.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {courses.courses.length} of {courses.total} courses
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
                    Page {currentPage} of {courses.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(courses.totalPages, p + 1))}
                    disabled={currentPage === courses.totalPages}
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
