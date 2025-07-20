import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Chip
} from '@uni-feedback/ui'
import { User, Settings, Shield } from 'lucide-react'
import { useAuth } from '@providers'

export function ProfilePage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Username</label>
              <p className="text-sm text-muted-foreground">{user?.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <div className="mt-1">
                {user?.superuser ? (
                  <Chip label="Superuser" color="blue" />
                ) : (
                  <Chip label="Admin" color="gray" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Actions
            </CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Update Profile
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Download Activity Log
            </Button>
          </CardContent>
        </Card>
      </div>

      {user?.superuser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Superuser Settings
            </CardTitle>
            <CardDescription>
              Advanced settings available to superusers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Superuser-specific functionality will be implemented here. This
              will include:
            </p>
            <ul className="mt-4 list-disc list-inside text-muted-foreground space-y-1">
              <li>System configuration options</li>
              <li>User management capabilities</li>
              <li>Platform-wide settings</li>
              <li>Advanced analytics and reports</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
