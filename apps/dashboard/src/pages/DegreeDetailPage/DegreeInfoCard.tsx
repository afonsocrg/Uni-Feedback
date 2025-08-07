import { EditableField, EditableSelect } from '@components'
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
import { DegreeEditDialog } from './DegreeEditDialog'

interface DegreeInfoCardProps {
  degree: AdminDegreeDetail
}
export function DegreeInfoCard({ degree }: DegreeInfoCardProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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
      toast.success('Degree updated successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update degree'
      )
    }
  })

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
              label="Name"
              value={degree.name}
              onSave={(newValue) => {
                updateMutation.mutate({ name: newValue })
              }}
              disabled={updateMutation.isPending}
            />
            <EditableField
              label="Acronym"
              value={degree.acronym}
              onSave={(newValue) => {
                updateMutation.mutate({ acronym: newValue })
              }}
              disabled={updateMutation.isPending}
            />
            <EditableSelect
              label="Type"
              value={degree.type}
              options={
                degreeTypesResponse?.types.map((type) => ({
                  value: type,
                  label: type
                })) || []
              }
              onSave={(newValue) => {
                updateMutation.mutate({ type: newValue })
              }}
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
