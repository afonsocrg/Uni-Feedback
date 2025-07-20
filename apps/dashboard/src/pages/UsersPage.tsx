import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button
} from '@uni-feedback/ui'
import { Users, UserPlus } from 'lucide-react'

export function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage admin users and their permissions
          </p>
        </div>
        <Button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600">
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
            User Management
          </CardTitle>
          <CardDescription>
            View and manage admin users for the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            User management functionality will be implemented here. This will
            include:
          </p>
          <ul className="mt-4 list-disc list-inside text-muted-foreground space-y-1">
            <li>List all admin users</li>
            <li>Invite new users via email</li>
            <li>Manage user permissions and roles</li>
            <li>View user activity and login history</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
