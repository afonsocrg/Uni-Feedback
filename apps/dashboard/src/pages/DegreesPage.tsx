import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button
} from '@uni-feedback/ui'
import { GraduationCap, Plus } from 'lucide-react'

export function DegreesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Degrees</h1>
          <p className="text-muted-foreground">
            Manage degree programs and their course structure
          </p>
        </div>
        <Button className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600">
          <Plus className="h-4 w-4" />
          Add Degree
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Degree Management
          </CardTitle>
          <CardDescription>View and manage degree programs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Degree management functionality will be implemented here. This will
            include:
          </p>
          <ul className="mt-4 list-disc list-inside text-muted-foreground space-y-1">
            <li>List all degree programs</li>
            <li>Add new degree programs</li>
            <li>Edit degree information and descriptions</li>
            <li>Manage course groups within degrees</li>
            <li>View courses associated with each degree</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
