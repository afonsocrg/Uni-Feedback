import { PaginationControls } from '@components'
import { useQuery } from '@tanstack/react-query'
import {
  getAdminCourseGroups,
  type AdminCourseGroup,
  type AdminCourseGroupsQuery
} from '@uni-feedback/api-client'
import {
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@uni-feedback/ui'
import { Edit3, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { CourseGroupEditDialog } from './CourseGroupEditDialog'
import { CreateCourseGroupDialog } from './CreateCourseGroupDialog'

interface CourseGroupsTabContentProps {
  degreeId: number
}
export function CourseGroupsTabContent({
  degreeId
}: CourseGroupsTabContentProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [editingCourseGroup, setEditingCourseGroup] =
    useState<AdminCourseGroup | null>(null)

  // Course Groups tab pagination (using local state to avoid conflicts with other tabs)
  const [courseGroupsPage, setCourseGroupsPage] = useState(1)
  const [courseGroupsLimit, setCourseGroupsLimit] = useState(20)

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

  const handleCreateCourseGroup = () => {
    setEditingCourseGroup(null)
    setIsCreateDialogOpen(true)
    setIsEditDialogOpen(false)
  }

  const handleEditCourseGroup = (courseGroup: AdminCourseGroup) => {
    setEditingCourseGroup(courseGroup)
    setIsCreateDialogOpen(false)
    setIsEditDialogOpen(true)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="bg-muted/50 border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-sm">About Course Groups</h4>
              <p className="text-xs text-muted-foreground">
                Course groups are used to aggregate similar courses within the
                same degree (e.g., specialization tracks, core subjects,
                electives). Each course may belong to multiple course groups,
                allowing flexible organization and helping students understand
                the structure of their degree.
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
                    <TableCell className="font-medium">{group.name}</TableCell>
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

      <CourseGroupEditDialog
        courseGroup={editingCourseGroup}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
      <CreateCourseGroupDialog
        degreeId={degreeId}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  )
}
