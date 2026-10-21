import { ConfirmationDialog } from '@components'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addAdminUserJourneyDegree,
  getAdminUserJourney,
  removeAdminUserJourneyDegree,
  updateAdminUserJourneyDegree,
  type JourneyDegree,
  type JourneyDegreeInput
} from '@uni-feedback/api-client'
import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@uni-feedback/ui'
import { formatSchoolYearString } from '@uni-feedback/utils'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { JourneyDegreeDialog } from './JourneyDegreeDialog'

interface UserJourneyTabContentProps {
  userId: number
}

function formatYears(degree: JourneyDegree): string {
  const { startSchoolYear: start, endSchoolYear: end } = degree
  const fmt = (y: number) => formatSchoolYearString(y, { yearFormat: 'short' })
  if (start === null && end === null) return '-'
  if (end === null) return `${fmt(start as number)} – ongoing`
  if (start === null) return `until ${fmt(end)}`
  return `${fmt(start)} – ${fmt(end)}`
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error occurred'
}

/**
 * The degrees the user declared in "O meu percurso". Declared, not verified,
 * so an admin can fix them by hand: add, edit the degree or years, or remove.
 */
export function UserJourneyTabContent({ userId }: UserJourneyTabContentProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  // The entry being edited; null while adding
  const [editing, setEditing] = useState<JourneyDegree | null>(null)

  const {
    data: journey,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-journey', userId],
    queryFn: () => getAdminUserJourney(userId)
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['user-journey', userId] })
    queryClient.invalidateQueries({ queryKey: ['user-details', userId] })
  }

  const saveMutation = useMutation({
    mutationFn: (input: JourneyDegreeInput) =>
      editing
        ? updateAdminUserJourneyDegree(userId, editing.id as number, input)
        : addAdminUserJourneyDegree(userId, input),
    onSuccess: () => {
      toast.success(editing ? 'Degree updated' : 'Degree added')
      setDialogOpen(false)
      invalidate()
    },
    onError: (err) => toast.error(errorMessage(err))
  })

  const removeMutation = useMutation({
    mutationFn: (userDegreeId: number) =>
      removeAdminUserJourneyDegree(userId, userDegreeId),
    onSuccess: () => {
      toast.success('Degree removed')
      invalidate()
    },
    onError: (err) => toast.error(errorMessage(err))
  })

  const openDialog = (entry: JourneyDegree | null) => {
    setEditing(entry)
    setDialogOpen(true)
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load academic journey</p>
        <p className="text-sm text-muted-foreground">{errorMessage(error)}</p>
      </div>
    )
  }

  if (isLoading || !journey) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading academic journey...</p>
      </div>
    )
  }

  const degrees = journey.degrees

  return (
    <>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => openDialog(null)}>
          <Plus className="h-4 w-4" />
          Add degree
        </Button>
      </div>

      {degrees.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            This user has not added any degree yet
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Degree</TableHead>
                <TableHead className="w-32">Faculty</TableHead>
                <TableHead className="w-48">Years</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {degrees.map((degree) => (
                <TableRow
                  key={degree.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/degrees/${degree.degreeId}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Chip label={degree.degreeAcronym} />
                      <span className="text-sm">{degree.degreeName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {degree.facultyShortName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatYears(degree)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDialog(degree)}
                        aria-label={`Edit ${degree.degreeAcronym}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmationDialog
                        title="Remove degree"
                        message={`Remove ${degree.degreeAcronym} from this user's academic journey?`}
                        confirmText="Remove"
                        variant="destructive"
                        onConfirm={() =>
                          removeMutation.mutateAsync(degree.id as number)
                        }
                      >
                        {({ open }) => (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={open}
                            aria-label={`Remove ${degree.degreeAcronym}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </ConfirmationDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <JourneyDegreeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editing}
        takenDegreeIds={degrees
          .filter((d) => d.id !== editing?.id)
          .map((d) => d.degreeId)}
        isSaving={saveMutation.isPending}
        onSave={(input) => saveMutation.mutate(input)}
      />
    </>
  )
}
