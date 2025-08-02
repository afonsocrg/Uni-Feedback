import {
  CourseGroupEditDialog,
  DegreeEditDialog,
  EditableField,
  PaginationControls,
  SelectableField
} from '@components'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAdminCourseGroups,
  getAdminCoursesNew,
  getAdminDegreeDetails,
  getAdminDegreeTypes,
  updateDegree,
  type AdminCourseGroup,
  type AdminCourseGroupsQuery,
  type AdminCoursesQuery
} from '@uni-feedback/api-client'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chip,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Markdown,
  MarkdownTextarea,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@uni-feedback/ui'
import {
  ArrowLeft,
  BookOpen,
  Edit3,
  GraduationCap,
  Plus,
  Users
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

export function DegreeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false)
  const [descriptionValue, setDescriptionValue] = useState('')
  const [isDegreeEditDialogOpen, setIsDegreeEditDialogOpen] = useState(false)
  const [isCourseGroupDialogOpen, setIsCourseGroupDialogOpen] = useState(false)
  const [editingCourseGroup, setEditingCourseGroup] =
    useState<AdminCourseGroup | null>(null)

  // Tab state
  const [activeTab, setActiveTab] = useState('courses')

  // Courses tab pagination (using local state to avoid conflicts with other tabs)
  const [coursesPage, setCoursesPage] = useState(1)
  const [coursesLimit, setCoursesLimit] = useState(20)

  // Course Groups tab pagination (using local state to avoid conflicts with other tabs)
  const [courseGroupsPage, setCourseGroupsPage] = useState(1)
  const [courseGroupsLimit, setCourseGroupsLimit] = useState(20)

  const degreeId = id ? parseInt(id, 10) : 0

  const {
    data: degree,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['degree-details', degreeId],
    queryFn: () => getAdminDegreeDetails(degreeId),
    enabled: !!degreeId
  })

  // Courses query
  const coursesQuery: AdminCoursesQuery = {
    page: coursesPage,
    limit: coursesLimit,
    degree_id: degreeId
  }

  const { data: coursesResponse, isLoading: coursesLoading } = useQuery({
    queryKey: ['admin-courses', coursesQuery],
    queryFn: () => getAdminCoursesNew(coursesQuery),
    enabled: !!degreeId
  })

  // Course Groups query
  const courseGroupsQuery: AdminCourseGroupsQuery = {
    page: courseGroupsPage,
    limit: courseGroupsLimit,
    degree_id: degreeId
  }

  const { data: courseGroupsResponse, isLoading: courseGroupsLoading } =
    useQuery({
      queryKey: ['admin-course-groups', courseGroupsQuery],
      queryFn: () => getAdminCourseGroups(courseGroupsQuery),
      enabled: !!degreeId
    })

  // Degree types query for the faculty
  const { data: degreeTypesResponse } = useQuery({
    queryKey: ['degree-types', degree?.facultyId],
    queryFn: () => getAdminDegreeTypes(degree?.facultyId),
    enabled: !!degree?.facultyId
  })

  const updateMutation = useMutation({
    mutationFn: (updates: {
      name?: string
      acronym?: string
      type?: string
      description?: string | null
    }) => updateDegree(degreeId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['degree-details', degreeId]
      })
      queryClient.invalidateQueries({ queryKey: ['admin-degrees'] })
      setEditingField(null)
      setEditValues({})
      setIsDescriptionDialogOpen(false)
      toast.success('Degree updated successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update degree'
      )
    }
  })

  const handleEdit = (field: string, currentValue: string) => {
    if (field === 'description') {
      setDescriptionValue(currentValue || '')
      setIsDescriptionDialogOpen(true)
    } else {
      setEditingField(field)
      setEditValues({ [field]: currentValue })
    }
  }

  const handleSave = (field: string) => {
    const value = editValues[field]
    if (value !== undefined) {
      updateMutation.mutate({ [field]: value })
    }
  }

  const handleSaveDescription = () => {
    updateMutation.mutate({ description: descriptionValue })
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValues({})
  }

  const handleEditValueChange = (field: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const editingFieldName = editingField
      if (editingFieldName) {
        handleSave(editingFieldName)
      }
    }
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleCreateCourseGroup = () => {
    setEditingCourseGroup(null)
    setIsCourseGroupDialogOpen(true)
  }

  const handleEditCourseGroup = (courseGroup: AdminCourseGroup) => {
    setEditingCourseGroup(courseGroup)
    setIsCourseGroupDialogOpen(true)
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case 'courses':
        return `Courses (${degree?.courseCount || 0})`
      case 'course-groups':
        return `Course Groups (${courseGroupsResponse?.total || 0})`
      case 'description':
        return 'Description'
      default:
        return 'Details'
    }
  }

  if (!degreeId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Invalid degree ID
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Failed to load degree details
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <button onClick={() => refetch()} className="mt-4">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || !degree) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="border rounded-lg">
          <div className="p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-4">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/degrees')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Degrees
        </Button>
        <div className="flex items-center gap-2 text-primaryBlue">
          <GraduationCap className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{degree.name}</h1>
        </div>
      </div>

      {/* Degree Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Degree Information
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDegreeEditDialogOpen(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Faculty (non-editable, clickable) */}
            <div className="space-y-2">
              <dt className="font-medium text-sm">Faculty</dt>
              <dd>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => navigate(`/faculties/${degree.facultyId}`)}
                >
                  {degree.facultyShortName} - {degree.facultyName}
                </Badge>
              </dd>
            </div>

            <EditableField
              field="name"
              label="Name"
              value={degree.name}
              isEditing={editingField === 'name'}
              editValue={editValues['name'] || ''}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onChange={handleEditValueChange}
              onKeyDown={handleKeyDown}
              disabled={updateMutation.isPending}
            />
            <EditableField
              field="acronym"
              label="Acronym"
              value={degree.acronym}
              isEditing={editingField === 'acronym'}
              editValue={editValues['acronym'] || ''}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onChange={handleEditValueChange}
              onKeyDown={handleKeyDown}
              disabled={updateMutation.isPending}
            />
            <SelectableField
              field="type"
              label="Type"
              value={degree.type}
              options={degreeTypesResponse?.types || []}
              isEditing={editingField === 'type'}
              editValue={editValues['type'] || ''}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onChange={handleEditValueChange}
              disabled={updateMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="courses">
            <BookOpen className="h-4 w-4" />
            <span>Courses</span>
          </TabsTrigger>
          <TabsTrigger value="course-groups">
            <BookOpen className="h-4 w-4" />
            <span>Course Groups</span>
          </TabsTrigger>
          <TabsTrigger value="description">
            <BookOpen className="h-4 w-4" />
            <span>Description</span>
          </TabsTrigger>
        </TabsList>
        <Card>
          <CardHeader>
            <CardTitle>{getTabTitle()}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Courses Tab */}
            <TabsContent value="courses" className="space-y-4">
              {coursesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !coursesResponse?.data.length ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No courses found for this degree
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead>ECTS</TableHead>
                          <TableHead>Terms</TableHead>
                          <TableHead className="text-right">Feedback</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coursesResponse.data.map((course) => (
                          <TableRow
                            key={course.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/courses/${course.id}`)}
                          >
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm font-medium">
                                  {course.name}
                                </div>
                                <div className="font-mono text-sm text-muted-foreground">
                                  {course.acronym}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{course.ects || 'N/A'}</TableCell>
                            <TableCell>
                              {course.terms?.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {course.terms.map((term, index) => (
                                    <Chip key={index} label={term} />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  N/A
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {course.feedbackCount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {coursesResponse && (
                    <PaginationControls
                      currentPage={coursesResponse.page}
                      totalPages={coursesResponse.totalPages}
                      pageSize={coursesResponse.limit}
                      total={coursesResponse.total}
                      onPageChange={(page) => {
                        setCoursesPage(page)
                      }}
                      onPageSizeChange={(limit) => {
                        setCoursesPage(1)
                        setCoursesLimit(limit)
                      }}
                    />
                  )}
                </div>
              )}
            </TabsContent>

            {/* Course Groups Tab */}
            <TabsContent value="course-groups" className="space-y-4">
              <div className="space-y-4">
                <div className="bg-muted/50 border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">
                        About Course Groups
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Course groups are used to aggregate similar courses
                        within the same degree (e.g., specialization tracks,
                        core subjects, electives). Each course may belong to
                        multiple course groups, allowing flexible organization
                        and helping students understand the structure of their
                        degree.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleCreateCourseGroup}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course Group
                  </Button>
                </div>
              </div>

              {courseGroupsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !courseGroupsResponse?.data.length ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No course groups found for this degree
                  </p>
                  <Button onClick={handleCreateCourseGroup} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first course group
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courseGroupsResponse.data.map((group) => (
                          <TableRow key={group.id}>
                            <TableCell className="font-medium">
                              {group.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(group.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditCourseGroup(group)}
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {courseGroupsResponse && (
                    <PaginationControls
                      currentPage={courseGroupsResponse.page}
                      totalPages={courseGroupsResponse.totalPages}
                      pageSize={courseGroupsResponse.limit}
                      total={courseGroupsResponse.total}
                      onPageChange={(page) => {
                        setCourseGroupsPage(page)
                      }}
                      onPageSizeChange={(limit) => {
                        setCourseGroupsPage(1)
                        setCourseGroupsLimit(limit)
                      }}
                    />
                  )}
                </div>
              )}
            </TabsContent>

            {/* Description Tab */}
            <TabsContent value="description" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Degree Description</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleEdit('description', degree.description || '')
                    }
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Description
                  </Button>
                </div>
                <div className="text-sm">
                  {degree.description ? (
                    <div className="border rounded-md p-4 bg-muted/20">
                      <Markdown>{degree.description}</Markdown>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Edit3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">
                        No description provided
                      </h3>
                      <p className="text-muted-foreground mt-1">
                        Add a description to help students understand this
                        degree
                      </p>
                      <Button
                        onClick={() => handleEdit('description', '')}
                        className="mt-4"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Add Description
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* Description Edit Dialog */}
      <Dialog
        open={isDescriptionDialogOpen}
        onOpenChange={setIsDescriptionDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Description</DialogTitle>
            <DialogDescription>
              Update the degree description using Markdown formatting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <MarkdownTextarea
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value)}
              placeholder="Enter degree description..."
              className="min-h-[200px]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDescriptionDialogOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDescription}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Degree Edit Dialog */}
      <DegreeEditDialog
        degree={degree}
        open={isDegreeEditDialogOpen}
        onOpenChange={setIsDegreeEditDialogOpen}
      />

      {/* Course Group Edit/Create Dialog */}
      <CourseGroupEditDialog
        courseGroup={editingCourseGroup}
        degreeId={degreeId}
        open={isCourseGroupDialogOpen}
        onOpenChange={setIsCourseGroupDialogOpen}
      />
    </div>
  )
}
