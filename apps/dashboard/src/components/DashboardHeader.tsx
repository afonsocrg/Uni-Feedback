import { Button } from '@uni-feedback/ui'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '@providers'
import { toast } from 'sonner'

export function DashboardHeader() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout failed:', error)
      toast.error('Failed to logout')
    }
  }

  const maskEmail = (email: string) => {
    const [localPart, domain] = email.split('@')
    if (localPart.length <= 2) return email

    const masked = localPart.slice(0, 2) + '*'.repeat(localPart.length - 2)
    return `${masked}@${domain}`
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-gradient-to-r from-background to-muted/30 px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-primaryBlue to-primaryBlue/80 bg-clip-text text-transparent">
            Welcome back!
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/50 rounded-lg border">
          <div className="p-1.5 bg-primaryBlue/10 rounded-full">
            <User className="h-3 w-3 text-primaryBlue" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.username}</span>
            <span className="text-xs text-muted-foreground">
              {user?.email ? maskEmail(user.email) : ''}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  )
}
