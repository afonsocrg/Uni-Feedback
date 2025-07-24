import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input
} from '@uni-feedback/ui'
import { getAdminFaculties, type AdminFacultiesResponse } from '@uni-feedback/api-client'
import { Building2, Plus, GraduationCap, BookOpen, MessageSquare } from 'lucide-react'

export function FacultiesPage() {
  const [faculties, setFaculties] = useState<AdminFacultiesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchFaculties() {
      try {
        setIsLoading(true)
        const data = await getAdminFaculties({
          page: currentPage,
          limit: 20,
          search: searchTerm || undefined
        })
        setFaculties(data)
      } catch (error) {
        console.error('Failed to fetch faculties:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFaculties()
  }, [currentPage, searchTerm])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculties</h1>
          <p className="text-muted-foreground">
            Manage university faculties and their information
          </p>
        </div>
        <Button className="flex items-center gap-2 bg-green-500 hover:bg-green-600">
          <Plus className="h-4 w-4" />
          Add Faculty
        </Button>
      </div>

      <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 bg-green-500 rounded-lg">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            Faculty Management
          </CardTitle>
          <CardDescription>
            View and manage university faculties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search faculties..."
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
            ) : faculties?.faculties.length ? (
              <div className="space-y-3">
                {faculties.faculties.map((faculty) => (
                  <div key={faculty.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-12 w-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center font-semibold">
                      {faculty.code.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold">{faculty.name}</h3>
                      </div>
                      {faculty.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {faculty.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <GraduationCap className="h-3 w-3" />
                          <span>{faculty.degreeCount} degrees</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{faculty.courseCount} courses</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{faculty.feedbackCount} reviews</span>
                        </div>
                        <span>Created: {new Date(faculty.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View Degrees
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No faculties found</p>
              </div>
            )}

            {faculties && faculties.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {faculties.faculties.length} of {faculties.total} faculties
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
                    Page {currentPage} of {faculties.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(faculties.totalPages, p + 1))}
                    disabled={currentPage === faculties.totalPages}
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
