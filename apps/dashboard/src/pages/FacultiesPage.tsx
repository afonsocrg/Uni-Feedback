import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button
} from '@uni-feedback/ui'
import { Building2, Plus } from 'lucide-react'

export function FacultiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculties</h1>
          <p className="text-muted-foreground">
            Manage university faculties and their information
          </p>
        </div>
        <Button className="flex items-center gap-2 bg-green-500 hover:bg-green-600">
          <Plus className="h-4 w-4" />
          Add Faculty
        </Button>
      </div>

      <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 bg-green-500 rounded-lg">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            Faculty Management
          </CardTitle>
          <CardDescription>
            View and manage university faculties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Faculty management functionality will be implemented here. This will
            include:
          </p>
          <ul className="mt-4 list-disc list-inside text-muted-foreground space-y-1">
            <li>List all faculties with details</li>
            <li>Add new faculties</li>
            <li>Edit faculty information</li>
            <li>View degrees within each faculty</li>
            <li>Manage faculty email suffixes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
