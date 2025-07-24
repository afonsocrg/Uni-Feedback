import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Chip
} from '@uni-feedback/ui'
import { getAdminUsers, type AdminUsersResponse } from '@uni-feedback/api-client'
import { Users, UserPlus } from 'lucide-react'

export function UsersPage() {
  const [users, setUsers] = useState<AdminUsersResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true)
        const data = await getAdminUsers({
          page: currentPage,
          limit: 20,
          search: searchTerm || undefined
        })
        setUsers(data)
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [currentPage, searchTerm])

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
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-48 bg-muted rounded animate-pulse"></div>
                    </div>
                    <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : users?.users.length ? (
              <div className="space-y-3">
                {users.users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{user.username}</p>
                        {user.superuser && (
                          <Chip label="Superuser" color="blue" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                        {user.lastLoginAt && (
                          <> • Last login: {new Date(user.lastLoginAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}

            {users && users.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {users.users.length} of {users.total} users
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {users.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(users.totalPages, p + 1))}
                    disabled={currentPage === users.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
