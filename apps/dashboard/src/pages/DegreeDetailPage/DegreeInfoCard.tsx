import { DegreeEditDialog, EditableField, SelectableField } from '@components'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AdminDegreeDetail,
  getAdminDegreeTypes,
  updateDegree
} from '@uni-feedback/api-client'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@uni-feedback/ui'
import { Edit3 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

interface DegreeInfoCardProps {
  degree: AdminDegreeDetail
}
export function DegreeInfoCard({ degree }: DegreeInfoCardProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [isDegreeEditDialogOpen, setIsDegreeEditDialogOpen] = useState(false)

  const degreeId = id ? parseInt(id, 10) : 0
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
      toast.success('Degree updated successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update degree'
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

  return (
    <>
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
            {/* Faculty (non-editable, clickable) - moved to top */}
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

      <DegreeEditDialog
        degree={degree}
        open={isDegreeEditDialogOpen}
        onOpenChange={setIsDegreeEditDialogOpen}
      />
    </>
  )
}
