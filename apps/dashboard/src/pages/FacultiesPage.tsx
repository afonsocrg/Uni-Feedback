import { useQuery } from '@tanstack/react-query'
import { getFaculties } from '@uni-feedback/api-client'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@uni-feedback/ui'
import { Building2, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function FacultiesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const {
    data: faculties = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['faculties'],
    queryFn: getFaculties
  })

  const filteredFaculties = faculties.filter(
    (faculty) =>
      faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleFacultyClick = (facultyId: number) => {
    navigate(`/faculties/${facultyId}`)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Failed to load faculties
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button onClick={() => refetch()} className="mt-4">
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
          <Building2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Faculty Management</h1>
          <Badge variant="secondary" className="ml-2">
            {faculties.length}{' '}
            {faculties.length === 1 ? 'faculty' : 'faculties'}
          </Badge>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Faculties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or short name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : filteredFaculties.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">
                {searchTerm ? 'No faculties found' : 'No faculties yet'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'No faculties have been added to the system'}
              </p>
            </div>
          ) : (
            /* Faculties Table */
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Short Name</TableHead>
                    <TableHead>Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFaculties.map((faculty) => (
                    <TableRow
                      key={faculty.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleFacultyClick(faculty.id)}
                    >
                      <TableCell className="font-medium">
                        {faculty.shortName}
                      </TableCell>
                      <TableCell>{faculty.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
