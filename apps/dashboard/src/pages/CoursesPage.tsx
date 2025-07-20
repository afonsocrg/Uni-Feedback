import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button
} from '@uni-feedback/ui'
import { BookOpen, Plus } from 'lucide-react'

export function CoursesPage() {
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Management
          </CardTitle>
          <CardDescription>
            View and manage courses across all degrees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Course management functionality will be implemented here. This will
            include:
          </p>
          <ul className="mt-4 list-disc list-inside text-muted-foreground space-y-1">
            <li>List all courses with search and filtering</li>
            <li>Add new courses</li>
            <li>Edit course information and details</li>
            <li>Manage identical course relationships</li>
            <li>Assign courses to course groups</li>
            <li>View associated feedback</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
