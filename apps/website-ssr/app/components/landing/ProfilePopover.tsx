import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator
} from '@uni-feedback/ui'
import { LogOut, User } from 'lucide-react'

interface ProfilePopoverProps {
  isAuthenticated: boolean
  user?: {
    username: string
    email: string
  } | null
  logout: () => void
}

export function ProfilePopover({
  isAuthenticated,
  user,
  logout
}: ProfilePopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="size-9 rounded-full p-0">
          <User className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        {isAuthenticated ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Separator />
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="sm"
                asChild
              >
                <a href="/profile">
                  <User className="size-4 mr-2" />
                  Profile
                </a>
              </Button>
            </div>
            <Separator />
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              size="sm"
              onClick={logout}
            >
              <LogOut className="size-4 mr-2" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sign in to Uni Feedback
            </p>
            <Button className="w-full" size="sm" asChild>
              <a href="/login">Sign in</a>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
