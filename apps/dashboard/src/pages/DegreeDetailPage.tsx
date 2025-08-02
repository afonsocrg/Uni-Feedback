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
    <div>
      <h1>Degree Detail Page - With Conditionals Test</h1>
      <p>This version has logic + conditional returns</p>
      <p>Degree ID: {id}</p>
      <p>Degree Name: {degree.name}</p>
      <p>Faculty: {degree.facultyName}</p>
    </div>
  )
}