import { AddSuffixDialog, EditableField, FacultyEditDialog } from '@components'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getFacultyDetails,
  removeFacultyEmailSuffix,
  updateFaculty
} from '@uni-feedback/api-client'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
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
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@uni-feedback/ui'
import {
  ArrowLeft,
  Building2,
  Edit3,
  HelpCircle,
  Plus,
  Search,
  X
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

export function FacultyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  const [degreesSearch, setDegreesSearch] = useState('')
  const [degreesTypeFilter, setDegreesTypeFilter] = useState<string>('all')
  const [hideEmptyDegrees, setHideEmptyDegrees] = useState(true)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddSuffixDialogOpen, setIsAddSuffixDialogOpen] = useState(false)

  const facultyId = id ? parseInt(id, 10) : 0

  const {
    data: faculty,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['faculty-details', facultyId],
    queryFn: () => getFacultyDetails(facultyId),
    enabled: !!facultyId
  })

  const updateMutation = useMutation({
    mutationFn: (updates: { name?: string; shortName?: string }) =>
      updateFaculty(facultyId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['faculty-details', facultyId]
      })
      queryClient.invalidateQueries({ queryKey: ['faculties'] })
      setEditingField(null)
      setEditValues({})
      toast.success('Faculty updated successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update faculty'
      )
    }
  })

  const removeSuffixMutation = useMutation({
    mutationFn: (suffix: string) => removeFacultyEmailSuffix(facultyId, suffix),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['faculty-details', facultyId]
      })
      queryClient.invalidateQueries({ queryKey: ['faculties'] })
      toast.success('Email suffix removed successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove email suffix'
      )
    }
  })

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValues({ [field]: currentValue })
  }

  const handleSave = (field: string) => {
    const value = editValues[field]
    if (value !== undefined) {
      updateMutation.mutate({ [field]: value })
    }
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValues({})
  }

  const handleDegreeClick = (degreeId: number) => {
    navigate(`/degrees/${degreeId}`)
  }

  const handleRemoveSuffix = (suffix: string) => {
    removeSuffixMutation.mutate(suffix)
  }

  if (!facultyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Invalid faculty ID
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
            Failed to load faculty details
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

  if (isLoading || !faculty) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const uniqueDegreeTypes = Array.from(
    new Set(faculty.degrees.map((degree) => degree.type))
  ).sort()

  const hasEmptyDegrees = faculty.degrees.some(
    (degree) => !degree.courseCount || degree.courseCount === 0
  )

  const filteredDegrees = faculty.degrees.filter((degree) => {
    const matchesSearch =
      degree.name.toLowerCase().includes(degreesSearch.toLowerCase()) ||
      degree.acronym.toLowerCase().includes(degreesSearch.toLowerCase())

    const matchesType =
      degreesTypeFilter === 'all' ||
      degree.type.toLowerCase() === degreesTypeFilter.toLowerCase()

    const hasCoursesOrShowEmpty =
      !hideEmptyDegrees || (degree.courseCount && degree.courseCount > 0)

    return matchesSearch && matchesType && hasCoursesOrShowEmpty
  })

  const handleEditValueChange = (field: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Find which field is being edited
      const editingFieldName = editingField
      if (editingFieldName) {
        handleSave(editingFieldName)
      }
    }
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/faculties')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Faculties
        </Button>
        <div className="flex items-center gap-2 text-primaryBlue">
          <Building2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{faculty.name}</h1>
        </div>
      </div>

      {/* Faculty Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Faculty Information
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit All
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <EditableField
              field="name"
              label="Name"
              value={faculty.name}
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
              field="shortName"
              label="Short Name"
              value={faculty.shortName}
              isEditing={editingField === 'shortName'}
              editValue={editValues['shortName'] || ''}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onChange={handleEditValueChange}
              onKeyDown={handleKeyDown}
              disabled={updateMutation.isPending}
            />

            {/* Email Suffixes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <dt className="font-medium text-sm">Email Suffixes</dt>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Email suffixes of students at this university (used to
                        validate emails when submitting feedback)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <dd className="flex flex-wrap gap-2">
                {faculty.emailSuffixes && faculty.emailSuffixes.length > 0
                  ? faculty.emailSuffixes.map((suffix, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="font-mono group hover:bg-destructive/10 transition-colors"
                      >
                        @{suffix}
                        <button
                          onClick={() => handleRemoveSuffix(suffix)}
                          className="ml-2 hover:text-destructive transition-colors"
                          disabled={removeSuffixMutation.isPending}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  : null}

                {/* Add Suffix Badge */}
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-accent/50 transition-colors border-dashed"
                  onClick={() => setIsAddSuffixDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add suffix
                </Badge>
              </dd>

              {(!faculty.emailSuffixes ||
                faculty.emailSuffixes.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  No email suffixes configured. Click "Add suffix" to add one.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Degrees Section */}
      <Card>
        <CardHeader>
          <CardTitle>Degrees ({faculty.degrees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search degrees..."
                value={degreesSearch}
                onChange={(e) => setDegreesSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={degreesTypeFilter}
              onValueChange={setDegreesTypeFilter}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {uniqueDegreeTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasEmptyDegrees && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hide-empty-degrees"
                  checked={hideEmptyDegrees}
                  onCheckedChange={setHideEmptyDegrees}
                />
                <Label
                  htmlFor="hide-empty-degrees"
                  className="text-sm font-medium cursor-pointer"
                >
                  Hide empty degrees
                </Label>
              </div>
            )}
          </div>

          {filteredDegrees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {degreesSearch || degreesTypeFilter !== 'all'
                  ? 'No degrees found matching your search'
                  : 'No degrees found'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Acronym</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Courses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDegrees.map((degree) => (
                    <TableRow
                      key={degree.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleDegreeClick(degree.id)}
                    >
                      <TableCell className="font-medium">
                        {degree.acronym}
                      </TableCell>
                      <TableCell>{degree.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{degree.type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {degree.courseCount || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <FacultyEditDialog
        faculty={faculty}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {/* Add Suffix Dialog */}
      <AddSuffixDialog
        facultyId={facultyId}
        open={isAddSuffixDialogOpen}
        onOpenChange={setIsAddSuffixDialogOpen}
      />
    </div>
  )
}
